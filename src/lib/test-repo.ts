import { scoreAssessment, toPublicQuestions } from "./assessment";
import { recommend } from "./recommend";
import { assembleResources, verifyBundle } from "./resources";
import { readBucket, updateBucket, type StoredPaper } from "./session-store";
import type { ProgressReport, Question, StudyPack, TestDifficulty, TestPaper, TestResult, TestSummary, Tutor } from "./types";
import { coursesMatch } from "./tutors";
import type { Owner } from "./tutor-repo";

function summary(paper: StoredPaper): TestSummary {
  return {
    id: paper.id,
    course: paper.course,
    status: paper.status,
    questionCount: paper.questions.length,
    difficulty: paper.difficulty,
    topics: paper.topics,
    score: paper.result?.score ?? null,
    total: paper.result?.total ?? null,
    createdAt: paper.createdAt,
    submittedAt: paper.submittedAt,
  };
}

export function toPaper(paper: StoredPaper): TestPaper {
  return { ...summary(paper), questions: toPublicQuestions(paper.questions) };
}

export async function hasOpenTest(ownerId: string) {
  const bucket = await readBucket(ownerId);
  return bucket.papers.some((paper) => paper.kind === "test" && paper.status === "open");
}

export async function listTests(ownerId: string) {
  const bucket = await readBucket(ownerId);
  return bucket.papers.filter((paper) => paper.kind === "test").map(summary);
}

export async function getPaper(ownerId: string, id: string) {
  const bucket = await readBucket(ownerId);
  return bucket.papers.find((paper) => paper.id === id) ?? null;
}

export async function createPaper(input: {
  ownerId: string;
  course: string;
  tutorId: string | null;
  difficulty: TestDifficulty;
  topics: string[];
  questions: Question[];
  kind: "test" | "practice";
}) {
  const paper: StoredPaper = {
    id: crypto.randomUUID(),
    ownerId: input.ownerId,
    course: input.course,
    tutorId: input.tutorId,
    difficulty: input.difficulty,
    topics: input.topics,
    kind: input.kind,
    status: "open",
    questions: input.questions,
    result: null,
    createdAt: new Date().toISOString(),
    submittedAt: null,
  };
  await updateBucket(input.ownerId, (bucket) => {
    bucket.papers.unshift(paper);
  });
  return paper;
}

export async function submitPaper(owner: Owner, id: string, answers: number[], tutors: Tutor[]) {
  const existing = await getPaper(owner.id, id);
  if (!existing) return null;
  if (existing.result) return existing.result;

  const graded = scoreAssessment(existing.questions, answers);
  const weakest = graded.weakTopics[0] ?? [...graded.topicBreakdown].sort((a, b) => a.percent - b.percent)[0];
  const topic = weakest?.topic ?? existing.course;
  const tutor = tutors.find((item) => coursesMatch(item.course, existing.course)) ?? null;
  const tutorHref = tutor ? `/student/tutor/${tutor.id}` : "/student/tutors";
  const recommendations = [
    recommend({
      subject: existing.course,
      topic,
      score: graded.score,
      total: graded.total,
      tutorHref,
      quizHref: "/student/tests",
    }),
  ];
  if (graded.weakTopics.length > 0) {
    recommendations.push({
      action: "practice",
      title: `Retake on ${topic}`,
      detail: "A new test can stay on the weaker topic. One score is a signal, not a measure of ability.",
      href: "/student/tests",
    });
  }
  let resources = assembleResources({
    subject: existing.course,
    topic,
    level: tutor?.level ?? "intermediate",
    preference: "mixed",
    weakTopic: graded.weakTopics[0]?.topic,
  });
  try {
    resources = await verifyBundle(resources);
  } catch {
    resources = { ...resources };
  }
  const submittedAt = new Date().toISOString();
  const result: TestResult = {
    id: existing.id,
    course: existing.course,
    score: graded.score,
    total: graded.total,
    correct: graded.score,
    incorrect: graded.total - graded.score,
    percent: graded.percent,
    topicBreakdown: graded.topicBreakdown,
    weakTopics: graded.weakTopics,
    items: graded.items,
    recommendations,
    resources,
    submittedAt,
    tutorId: tutor?.id ?? existing.tutorId,
  };

  await updateBucket(owner.id, (bucket) => {
    const paper = bucket.papers.find((item) => item.id === id);
    if (!paper || paper.result) return;
    paper.status = "submitted";
    paper.submittedAt = submittedAt;
    paper.result = result;
  });

  if (owner.supabase && existing.kind === "test") {
    try {
      await owner.supabase.from("test_attempts").insert({
        id: result.id,
        user_id: owner.id,
        course: result.course,
        kind: "test",
        score: result.score,
        total: result.total,
        topic_breakdown: result.topicBreakdown,
        results: result,
      });
    } catch {
      // The session copy is still the score the student sees.
    }
  }

  return result;
}

export async function listMaterials(ownerId: string) {
  const bucket = await readBucket(ownerId);
  return bucket.materials;
}

export async function savePack(ownerId: string, pack: StudyPack) {
  await updateBucket(ownerId, (bucket) => {
    bucket.materials = [pack, ...bucket.materials.filter((item) => item.id !== pack.id)].slice(0, 40);
  });
}

export async function buildProgress(owner: Owner, tutors: Tutor[]): Promise<ProgressReport> {
  const bucket = await readBucket(owner.id);
  const results = new Map<string, TestResult>();
  for (const paper of bucket.papers) {
    if (paper.kind === "test" && paper.result) results.set(paper.result.id, paper.result);
  }
  if (owner.supabase) {
    const { data } = await owner.supabase
      .from("test_attempts")
      .select("id, results")
      .order("created_at", { ascending: false });
    if (data) {
      for (const row of data as { id: string; results: TestResult | null }[]) {
        if (row.results && !results.has(row.id)) results.set(row.id, row.results);
      }
    }
  }
  const list = [...results.values()].sort((a, b) => (a.submittedAt < b.submittedAt ? 1 : -1));
  const topicMap = new Map<string, { course: string; correct: number; total: number }>();
  for (const result of list) {
    for (const topic of result.topicBreakdown) {
      const key = `${result.course}::${topic.topic}`;
      const row = topicMap.get(key) ?? { course: result.course, correct: 0, total: 0 };
      row.correct += topic.correct;
      row.total += topic.total;
      topicMap.set(key, row);
    }
  }
  const topics = [...topicMap.entries()].map(([key, row]) => ({
    topic: key.split("::")[1] ?? key,
    course: row.course,
    correct: row.correct,
    total: row.total,
    percent: row.total === 0 ? 0 : Math.round((row.correct / row.total) * 100),
  }));
  const scoreSum = list.reduce((sum, result) => sum + result.score, 0);
  const totalSum = list.reduce((sum, result) => sum + result.total, 0);
  const history = list.map((result) => ({
    id: result.id,
    course: result.course,
    status: "submitted" as const,
    questionCount: result.total,
    difficulty: "medium" as const,
    topics: result.topicBreakdown.map((topic) => topic.topic),
    score: result.score,
    total: result.total,
    createdAt: result.submittedAt,
    submittedAt: result.submittedAt,
  }));
  return {
    testsTaken: list.length,
    averagePercent: totalSum === 0 ? null : Math.round((scoreSum / totalSum) * 100),
    topics: topics.sort((a, b) => b.percent - a.percent),
    weakTopics: topics
      .filter((topic) => topic.percent < 60)
      .map((topic) => {
        const tutor = tutors.find((item) => coursesMatch(item.course, topic.course));
        return {
          topic: topic.topic,
          course: topic.course,
          percent: topic.percent,
          tutorId: tutor?.id ?? null,
          tutorName: tutor?.name ?? null,
        };
      }),
    history,
  };
}
