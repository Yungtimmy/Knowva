import { scoreAssessment, toPublicQuestions } from "./assessment";
import { recommend } from "./recommend";
import { assembleResources, verifyBundle } from "./resources";
import { readBucket, updateBucket, type StoredPaper } from "./session-store";
import { canSealAnswers, openSeal, sealAnswers, type SealedAnswer } from "./test-seal";
import type { ProgressReport, Question, StudyPack, TestDifficulty, TestPaper, TestResult, TestSummary, Tutor } from "./types";
import { coursesMatch } from "./tutors";
import type { Owner } from "./tutor-repo";

export class TestStoreError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TestStoreError";
  }
}

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

type PaperRow = {
  id: string;
  user_id: string;
  course: string;
  tutor_id: string | null;
  difficulty: TestDifficulty;
  topics: string[] | null;
  kind: "test" | "practice";
  status: "open" | "submitted";
  questions: unknown;
  answer_seal: string;
  result: TestResult | null;
  created_at: string;
  submitted_at: string | null;
};

function assertStore<T>(error: { code?: string; message?: string } | null, fallback: string): asserts error is null {
  if (!error) return;
  console.error("test_papers", error.code ?? "error");
  if (error.code === "42P01" || /does not exist|schema cache/i.test(error.message ?? "")) {
    throw new TestStoreError("Test storage is not ready yet.");
  }
  throw new TestStoreError(fallback);
}

function uuidOrNull(value: string | null) {
  if (!value || !/^[0-9a-f-]{36}$/i.test(value)) return null;
  return value;
}

function publicQuestions(questions: Question[]) {
  return questions.map((question) => ({
    id: question.id,
    prompt: question.prompt,
    options: question.options,
    subject: question.subject,
    topic: question.topic,
    ...(question.marks ? { marks: question.marks } : {}),
  }));
}

export function mergeSealedQuestions(rows: unknown, sealed: SealedAnswer[] | null): Question[] | null {
  if (!Array.isArray(rows) || !sealed) return null;
  const byId = new Map(sealed.map((item) => [item.id, item]));
  const questions: Question[] = [];
  for (const row of rows) {
    if (!row || typeof row !== "object") return null;
    const item = row as Record<string, unknown>;
    const id = typeof item.id === "string" ? item.id : "";
    const answer = byId.get(id);
    if (!answer) return null;
    const options = Array.isArray(item.options) ? item.options.filter((option): option is string => typeof option === "string") : [];
    questions.push({
      id,
      prompt: typeof item.prompt === "string" ? item.prompt : "",
      options,
      answerIndex: answer.answerIndex,
      explanation: answer.explanation,
      subject: typeof item.subject === "string" ? item.subject : "",
      topic: typeof item.topic === "string" ? item.topic : "",
      ...(typeof item.marks === "number" ? { marks: item.marks } : {}),
    });
  }
  return questions;
}

function paperFromRow(row: PaperRow): StoredPaper {
  const questions = mergeSealedQuestions(row.questions, openSeal(row.answer_seal));
  if (!questions) throw new TestStoreError("Could not read this test. Start a new one.");
  return {
    id: row.id,
    ownerId: row.user_id,
    course: row.course,
    tutorId: row.tutor_id,
    difficulty: row.difficulty,
    topics: Array.isArray(row.topics) ? row.topics : [],
    kind: row.kind,
    status: row.status,
    questions,
    result: row.result,
    createdAt: row.created_at,
    submittedAt: row.submitted_at,
  };
}

async function insertRemote(owner: Owner, paper: StoredPaper) {
  if (!owner.supabase) return;
  if (!canSealAnswers()) throw new TestStoreError("Test storage is not configured on the server.");
  const seal = sealAnswers(
    paper.questions.map((question) => ({
      id: question.id,
      answerIndex: question.answerIndex,
      explanation: question.explanation,
    })),
  );
  if (!seal) throw new TestStoreError("Test storage is not configured on the server.");
  const row = {
    id: paper.id,
    user_id: owner.id,
    course: paper.course,
    tutor_id: uuidOrNull(paper.tutorId),
    difficulty: paper.difficulty,
    topics: paper.topics,
    kind: paper.kind,
    status: paper.status,
    questions: publicQuestions(paper.questions),
    answer_seal: seal,
    created_at: paper.createdAt,
  };
  const first = await owner.supabase.from("test_papers").insert(row);
  if (first.error?.code === "23503" && row.tutor_id) {
    const retry = await owner.supabase.from("test_papers").insert({ ...row, tutor_id: null });
    assertStore(retry.error, "Could not save this test.");
    return;
  }
  assertStore(first.error, "Could not save this test.");
}

export async function hasOpenTest(owner: Owner) {
  if (owner.supabase) {
    const { data, error } = await owner.supabase
      .from("test_papers")
      .select("id")
      .eq("user_id", owner.id)
      .eq("kind", "test")
      .eq("status", "open")
      .limit(1);
    assertStore(error, "Could not check the open test.");
    return (data?.length ?? 0) > 0;
  }
  const bucket = await readBucket(owner.id);
  return bucket.papers.some((paper) => paper.kind === "test" && paper.status === "open");
}

export async function listTests(owner: Owner) {
  if (owner.supabase) {
    const { data, error } = await owner.supabase
      .from("test_papers")
      .select("id, user_id, course, tutor_id, difficulty, topics, kind, status, questions, answer_seal, result, created_at, submitted_at")
      .eq("user_id", owner.id)
      .eq("kind", "test")
      .order("created_at", { ascending: false });
    assertStore(error, "Could not load tests.");
    return ((data ?? []) as PaperRow[]).map((row) => {
      const questions = Array.isArray(row.questions) ? row.questions : [];
      return {
        id: row.id,
        course: row.course,
        status: row.status,
        questionCount: questions.length,
        difficulty: row.difficulty,
        topics: Array.isArray(row.topics) ? row.topics : [],
        score: row.result?.score ?? null,
        total: row.result?.total ?? null,
        createdAt: row.created_at,
        submittedAt: row.submitted_at,
      };
    });
  }
  const bucket = await readBucket(owner.id);
  return bucket.papers.filter((paper) => paper.kind === "test").map(summary);
}

export async function getPaper(owner: Owner, id: string) {
  if (owner.supabase) {
    const { data, error } = await owner.supabase
      .from("test_papers")
      .select("id, user_id, course, tutor_id, difficulty, topics, kind, status, questions, answer_seal, result, created_at, submitted_at")
      .eq("user_id", owner.id)
      .eq("id", id)
      .maybeSingle();
    assertStore(error, "Could not open that test.");
    if (!data) return null;
    return paperFromRow(data as PaperRow);
  }
  const bucket = await readBucket(owner.id);
  return bucket.papers.find((paper) => paper.id === id) ?? null;
}

export async function createPaper(input: {
  owner: Owner;
  course: string;
  tutorId: string | null;
  difficulty: TestDifficulty;
  topics: string[];
  questions: Question[];
  kind: "test" | "practice";
}) {
  const paper: StoredPaper = {
    id: crypto.randomUUID(),
    ownerId: input.owner.id,
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
  if (input.owner.supabase) {
    await insertRemote(input.owner, paper);
    return paper;
  }
  await updateBucket(input.owner.id, (bucket) => {
    bucket.papers.unshift(paper);
  });
  return paper;
}

export async function submitPaper(owner: Owner, id: string, answers: number[], tutors: Tutor[]) {
  const existing = await getPaper(owner, id);
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

  if (owner.supabase) {
    const { error } = await owner.supabase
      .from("test_papers")
      .update({ status: "submitted", submitted_at: submittedAt, result })
      .eq("user_id", owner.id)
      .eq("id", id);
    assertStore(error, "Could not save the score.");
  } else {
    await updateBucket(owner.id, (bucket) => {
      const paper = bucket.papers.find((item) => item.id === id);
      if (!paper || paper.result) return;
      paper.status = "submitted";
      paper.submittedAt = submittedAt;
      paper.result = result;
    });
  }

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
    const papers = await owner.supabase
      .from("test_papers")
      .select("id, result")
      .eq("user_id", owner.id)
      .eq("status", "submitted");
    if (!papers.error && papers.data) {
      for (const row of papers.data as { id: string; result: TestResult | null }[]) {
        if (row.result && !results.has(row.id)) results.set(row.id, row.result);
      }
    }
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
