import { LessonEditor } from "@/components/teacher/LessonEditor";
import { lessons } from "@/lib/demo";

export default async function LessonPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <LessonEditor lessonId={id} initial={lessons[id] ?? null} />;
}
