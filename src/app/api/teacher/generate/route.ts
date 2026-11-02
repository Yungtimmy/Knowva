import { demoOutline, demoTeacherQuiz } from "@/lib/demo";
import { demoPayload, modelFailed, parseBody, readJson } from "@/lib/http";
import { generateStructured, llmConfigured } from "@/lib/llm";
import { saveMaterial } from "@/lib/persist";
import { modelOutlineSchema, modelQuizSchema, teacherGenerateSchema } from "@/lib/schemas";
import type { LessonOutline, Question } from "@/lib/types";

export const runtime = "nodejs";

function draftId(topic: string) {
  const slug = topic.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 36);
  return `${slug || "draft"}-${Math.random().toString(36).slice(2, 6)}`;
}

export async function POST(request: Request) {
  const parsed = parseBody(teacherGenerateSchema, await readJson(request));
  if (!parsed.ok) return parsed.response;
  const input = parsed.data;
  const minutes = input.minutes ?? 40;
  const id = draftId(input.topic);

  if (!llmConfigured()) {
    if (input.kind === "quiz" || input.kind === "marking_guide") {
      const quiz = demoTeacherQuiz(input);
      return demoPayload({
        ...quiz,
        id,
        status: "draft",
        kind: input.kind,
        title: input.topic,
        assignedClassIds: [],
      });
    }
    const outline: LessonOutline = demoOutline({ ...input, minutes });
    return demoPayload({
      id,
      status: "draft",
      kind: input.kind,
      title: input.topic,
      outline,
    });
  }

  try {
    if (input.kind === "quiz" || input.kind === "marking_guide") {
      const output = await generateStructured(
        modelQuizSchema,
        [
          `Draft a ${input.level} ${input.subject} quiz on ${input.topic}.`,
          input.questionMix ? `Question mix: ${input.questionMix}.` : "Include a few multiple-choice items and one theory mark scheme.",
          input.prompt ? `Teacher request: ${input.prompt}` : "",
          "Mark the correct option with answerIndex. Explanations are what students see after they answer.",
        ].join("\n"),
      );
      const questions: Question[] = output.questions.map((item, index) => ({
        id: `q${index + 1}`,
        prompt: item.prompt,
        options: item.options,
        answerIndex: item.answerIndex,
        explanation: item.explanation,
        subject: input.subject,
        topic: input.topic,
        marks: item.marks,
      }));
      const totalMarks =
        questions.reduce((sum, item) => sum + (item.marks ?? 1), 0) +
        output.markingGuide.reduce(
          (sum, item) => sum + item.points.reduce((inner, point) => inner + point.marks, 0),
          0,
        );
      const payload = {
        id,
        status: "draft" as const,
        kind: input.kind,
        title: input.topic,
        questions,
        markingGuide: output.markingGuide.map((item, index) => ({
          questionId: `theory-${index + 1}`,
          prompt: item.prompt,
          points: item.points,
          notes: item.notes,
        })),
        timeMinutes: output.timeMinutes,
        totalMarks,
        questionCount: questions.length + output.markingGuide.length,
        reviewedCount: 0,
      };
      await saveMaterial({
        kind: input.kind === "marking_guide" ? "marking_guide" : "quiz",
        title: input.topic,
        subject: input.subject,
        topic: input.topic,
        payload,
      });
      return Response.json({ demo: false, ...payload });
    }

    const outline = await generateStructured(
      modelOutlineSchema,
      [
        `Draft a ${minutes} minute ${input.level} ${input.subject} lesson on ${input.topic}.`,
        input.kind === "notes" ? "Write class notes a teacher can hand out." : "Write objectives, a timed plan, class notes, and common mistakes.",
        input.prompt ? `Teacher request: ${input.prompt}` : "",
        "The teacher will edit this before class. Do not claim it is ready to teach.",
      ].join("\n"),
    );
    const payload = {
      id,
      status: "draft" as const,
      kind: input.kind,
      title: input.topic,
      outline,
    };
    await saveMaterial({
      kind: "lesson",
      title: input.topic,
      subject: input.subject,
      topic: input.topic,
      payload,
    });
    return Response.json({ demo: false, ...payload });
  } catch {
    return modelFailed();
  }
}
