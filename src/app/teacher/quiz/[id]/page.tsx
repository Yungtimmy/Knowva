import { QuizEditor } from "@/components/teacher/QuizEditor";
import { teacherQuizzes } from "@/lib/demo";

export default async function QuizEditorPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { id } = await params;
  const query = await searchParams;
  return (
    <QuizEditor
      quizId={id}
      initial={teacherQuizzes[id] ?? null}
      presetKind={query.tab === "marking" ? "marking_guide" : "quiz"}
    />
  );
}
