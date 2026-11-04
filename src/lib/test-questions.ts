import { demoTestQuestions, isValidMcq } from "./assessment";
import type { Question } from "./types";
import { z } from "zod";

const looseQuestion = z.object({
  prompt: z.string().trim().min(1).max(500),
  options: z.array(z.string().trim().min(1).max(300)).min(2).max(6),
  answerIndex: z.number().int().nonnegative(),
  explanation: z.string().trim().min(1).max(800),
  topic: z.string().trim().min(1).max(160),
});

export type TestDraft = {
  course: string;
  topics: string[];
  count: number;
  difficulty: "easy" | "medium" | "hard";
};

export function normalizeTopics(topics: string[] | undefined, course: string) {
  const cleaned = (topics ?? [])
    .map((topic) => topic.replace(/\s+/g, " ").trim())
    .filter((topic) => topic.length > 0);
  return cleaned.length > 0 ? cleaned.slice(0, 8) : [course];
}

/** Keep model items that are real MCQs. Drop the rest instead of failing the whole paper. */
export function acceptGeneratedQuestions(items: unknown[], input: TestDraft) {
  const accepted: Question[] = [];
  const topics = input.topics.length > 0 ? input.topics : [input.course];
  items.forEach((item, index) => {
    const parsed = looseQuestion.safeParse(item);
    if (!parsed.success) return;
    const topic = topics.includes(parsed.data.topic) ? parsed.data.topic : (topics[index % topics.length] ?? input.course);
    const question: Question = {
      id: `q${accepted.length + 1}`,
      prompt: parsed.data.prompt,
      options: parsed.data.options,
      answerIndex: parsed.data.answerIndex,
      explanation: parsed.data.explanation,
      subject: input.course,
      topic,
    };
    if (isValidMcq(question)) accepted.push(question);
  });
  return accepted;
}

export function fillTestQuestions(accepted: Question[], input: TestDraft) {
  const questions = accepted.slice(0, input.count);
  if (questions.length < input.count) {
    const extra = demoTestQuestions({ ...input, count: input.count - questions.length });
    for (const question of extra) questions.push(question);
  }
  return questions.slice(0, input.count).map((question, index) => ({ ...question, id: `q${index + 1}` }));
}
