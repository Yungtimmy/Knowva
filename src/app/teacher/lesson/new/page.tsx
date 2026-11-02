import { LessonEditor } from "@/components/teacher/LessonEditor";

export default async function NewLessonPage({
  searchParams,
}: {
  searchParams: Promise<{ topic?: string }>;
}) {
  const query = await searchParams;
  return <LessonEditor initial={null} presetTopic={query.topic ?? ""} />;
}
