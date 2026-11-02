import { recommend } from "@/lib/recommend";
import { demoPayload, parseBody, readJson } from "@/lib/http";
import { llmConfigured } from "@/lib/llm";
import { saveQuizAttempt } from "@/lib/persist";
import { scoreSchema } from "@/lib/schemas";
import { scoreQuiz } from "@/lib/score";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const parsed = parseBody(scoreSchema, await readJson(request));
  if (!parsed.ok) return parsed.response;
  const input = parsed.data;
  const attempt = scoreQuiz(input.quizId, input.questions, input.answers);
  const recommendation = recommend({
    subject: input.subject,
    topic: input.topic,
    score: attempt.score,
    total: attempt.total,
    tutorHref: "/student/tutor",
    quizHref: `/student/quiz/${input.quizId}`,
  });

  await saveQuizAttempt({
    quizId: input.quizId,
    subject: input.subject,
    topic: input.topic,
    score: attempt.score,
    total: attempt.total,
    missed: attempt.missed,
  });

  const body = { attempt, recommendation };
  if (!llmConfigured()) return demoPayload(body);
  return Response.json({ demo: false, ...body });
}
