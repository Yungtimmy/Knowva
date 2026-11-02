import { QuizPlayer } from "@/components/student/QuizPlayer";
import { quizzes } from "@/lib/demo";

export default async function QuizPage({
  params,
  searchParams,
}: {
  params: Promise<{ quizId: string }>;
  searchParams: Promise<{ review?: string }>;
}) {
  const { quizId } = await params;
  const query = await searchParams;
  const fallback = quizzes[quizId] ?? null;
  return <QuizPlayer quizId={quizId} fallback={fallback} startOnReview={query.review === "1"} />;
}
