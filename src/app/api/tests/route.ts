import { NextResponse } from "next/server";
import { demoTestQuestions, isValidMcq, TEST_INSTRUCTIONS } from "@/lib/assessment";
import { demoPayload, modelFailed, parseBody, readJson } from "@/lib/http";
import { generateStructured, llmConfigured } from "@/lib/llm";
import { resolveOwner } from "@/lib/owner";
import { modelTestSchema, testCreateSchema } from "@/lib/schemas";
import { createPaper, hasOpenTest, listTests, toPaper } from "@/lib/test-repo";
import { getTutor } from "@/lib/tutor-repo";
import { assertSameCourse } from "@/lib/tutors";
import type { Question } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const owner = await resolveOwner();
  const tests = await listTests(owner.id);
  return NextResponse.json({ tests, persisted: owner.persisted });
}

export async function POST(request: Request) {
  const parsed = parseBody(testCreateSchema, await readJson(request));
  if (!parsed.ok) return parsed.response;
  const input = parsed.data;
  const owner = await resolveOwner();

  if (await hasOpenTest(owner.id)) {
    const open = (await listTests(owner.id)).find((test) => test.status === "open");
    return NextResponse.json(
      { error: "Submit the open test before starting another.", testId: open?.id ?? null },
      { status: 409 },
    );
  }

  let tutorId: string | null = null;
  if (input.tutorId) {
    const tutor = await getTutor(owner, input.tutorId);
    if (!tutor) return NextResponse.json({ error: "Tutor not found." }, { status: 404 });
    const same = assertSameCourse(tutor.course, input.course);
    if (!same.ok) return NextResponse.json({ error: same.error }, { status: 400 });
    tutorId = tutor.id;
  }

  const topics = input.topics?.length ? input.topics : [input.course];
  const questionCount = input.questionCount ?? 10;
  const difficulty = input.difficulty ?? "medium";
  const made = await makeQuestions({
    course: input.course,
    topics,
    count: questionCount,
    difficulty,
  });
  if (!made) return modelFailed();

  const paper = await createPaper({
    ownerId: owner.id,
    course: input.course,
    tutorId,
    difficulty,
    topics,
    questions: made.questions,
    kind: "test",
  });
  const test = toPaper(paper);
  if (made.demo) return demoPayload({ test });
  return NextResponse.json({ demo: false, test }, { status: 201 });
}

async function makeQuestions(input: {
  course: string;
  topics: string[];
  count: number;
  difficulty: "easy" | "medium" | "hard";
}): Promise<{ questions: Question[]; demo: boolean } | null> {
  if (!llmConfigured()) {
    return { questions: demoTestQuestions(input), demo: true };
  }
  try {
    const output = await generateStructured(
      modelTestSchema,
      [
        `Course only: ${input.course}.`,
        `Difficulty: ${input.difficulty}.`,
        `Topics: ${input.topics.join(", ")}.`,
        `Write ${input.count} questions. Do not leave this course.`,
      ].join("\n"),
      `${TEST_INSTRUCTIONS}\nCourse lock: ${input.course}.`,
    );
    const accepted: Question[] = [];
    output.questions.forEach((item, index) => {
      const question: Question = {
        id: `q${index + 1}`,
        prompt: item.prompt,
        options: item.options,
        answerIndex: item.answerIndex,
        explanation: item.explanation,
        subject: input.course,
        topic: input.topics.includes(item.topic) ? item.topic : (input.topics[index % input.topics.length] ?? input.course),
      };
      if (isValidMcq(question)) accepted.push({ ...question, id: `q${accepted.length + 1}` });
    });
    if (accepted.length === 0) return null;
    if (accepted.length < input.count) {
      const extra = demoTestQuestions({ ...input, count: input.count - accepted.length });
      extra.forEach((question) => accepted.push({ ...question, id: `q${accepted.length + 1}` }));
    }
    return { questions: accepted.slice(0, input.count), demo: false };
  } catch {
    return null;
  }
}
