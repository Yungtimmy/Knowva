import { scoreAssessment } from "@/lib/assessment";
import { recommend } from "@/lib/recommend";
import { demoPayload, parseBody, readJson } from "@/lib/http";
import { llmConfigured } from "@/lib/llm";
import { saveQuizAttempt } from "@/lib/persist";
import { scoreSchema } from "@/lib/schemas";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const parsed = parseBody(scoreSchema, await readJson(request));
  if (!parsed.ok) return parsed.response;
  const input = parsed.data;
  const graded = scoreAssessment(input.questions, input.answers);
  const attempt = {
    quizId: input.quizId,
    score: graded.score,
    total: graded.total,
    missed: graded.missed,
  };
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

  const body = {
    attempt,
    recommendation,
    topicBreakdown: graded.topicBreakdown,
    weakTopics: graded.weakTopics,
  };
  if (!llmConfigured()) return demoPayload(body);
  return Response.json({ demo: false, ...body });
}
