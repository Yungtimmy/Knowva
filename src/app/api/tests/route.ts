import { NextResponse } from "next/server";
import { demoTestQuestions, TEST_INSTRUCTIONS } from "@/lib/assessment";
import { demoPayload, modelFailed, parseBody, readJson } from "@/lib/http";
import { generateStructured, llmConfigured } from "@/lib/llm";
import { resolveOwner } from "@/lib/owner";
import { modelTestSchema, testCreateSchema } from "@/lib/schemas";
import { acceptGeneratedQuestions, fillTestQuestions, normalizeTopics, type TestDraft } from "@/lib/test-questions";
import { createPaper, hasOpenTest, listTests, TestStoreError, toPaper } from "@/lib/test-repo";
import { getTutor } from "@/lib/tutor-repo";
import { assertSameCourse } from "@/lib/tutors";
import type { Question } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET() {
  try {
    const owner = await resolveOwner();
    const tests = await listTests(owner);
    return NextResponse.json({ tests, persisted: owner.persisted });
  } catch (error) {
    return storeError(error);
  }
}

export async function POST(request: Request) {
  const parsed = parseBody(testCreateSchema, await readJson(request));
  if (!parsed.ok) return parsed.response;
  const input = parsed.data;
  try {
    const owner = await resolveOwner();

    if (await hasOpenTest(owner)) {
      const open = (await listTests(owner)).find((test) => test.status === "open");
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

    const draft: TestDraft = {
      course: input.course,
      topics: normalizeTopics(input.topics, input.course),
      count: input.questionCount ?? 10,
      difficulty: input.difficulty ?? "medium",
    };
    const made = await makeQuestions(draft);
    if ("error" in made) {
      const error = made.error.startsWith("The model") ? made.error : `The model did not answer. ${made.error}`;
      return NextResponse.json({ error }, { status: 502 });
    }

    const paper = await createPaper({
      owner,
      course: draft.course,
      tutorId,
      difficulty: draft.difficulty,
      topics: draft.topics,
      questions: made.questions,
      kind: "test",
    });
    const test = toPaper(paper);
    if (made.demo) return demoPayload({ test });
    return NextResponse.json({ demo: false, test }, { status: 201 });
  } catch (error) {
    if (error instanceof TestStoreError) return NextResponse.json({ error: error.message }, { status: 500 });
    console.error("POST /api/tests", error instanceof Error ? error.name : "error");
    return modelFailed(error instanceof Error ? error.message : undefined);
  }
}

function storeError(error: unknown) {
  if (error instanceof TestStoreError) return NextResponse.json({ error: error.message }, { status: 500 });
  console.error("GET /api/tests", error instanceof Error ? error.name : "error");
  return NextResponse.json({ error: "Could not load tests." }, { status: 500 });
}

async function makeQuestions(input: TestDraft): Promise<{ questions: Question[]; demo: boolean } | { error: string }> {
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
        `Write ${input.count} questions. Each question has exactly 4 options and one answerIndex from 0 to 3.`,
        "Do not leave this course.",
      ].join("\n"),
      `${TEST_INSTRUCTIONS}\nCourse lock: ${input.course}.`,
      { timeoutMs: 20_000, maxRetries: 0 },
    );
    const accepted = acceptGeneratedQuestions(output.questions, input);
    if (accepted.length === 0) return { error: "The questions did not pass a check." };
    return { questions: fillTestQuestions(accepted, input), demo: false };
  } catch (error) {
    console.error("test generate", error instanceof Error ? error.name : "error");
    const message = error instanceof Error ? error.message : "";
    if (/timeout|aborted/i.test(message)) return { error: "The model took too long. Try again in a moment." };
    if (/key|bearer|token|authorization|secret/i.test(message)) return { error: "Try again in a moment." };
    return { error: "Try again in a moment." };
  }
}
