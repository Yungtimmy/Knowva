import { QuizEditor } from "@/components/teacher/QuizEditor";

export default async function NewQuizPage({
  searchParams,
}: {
  searchParams: Promise<{ topic?: string; kind?: string }>;
}) {
  const query = await searchParams;
  const kind = query.kind === "marking_guide" ? "marking_guide" : "quiz";
  return <QuizEditor initial={null} presetTopic={query.topic ?? ""} presetKind={kind} />;
}
