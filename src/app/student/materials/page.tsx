import { MaterialsStudio } from "@/components/student/MaterialsStudio";

export default async function MaterialsPage({
  searchParams,
}: {
  searchParams: Promise<{ subject?: string; topic?: string }>;
}) {
  const query = await searchParams;
  return <MaterialsStudio initialSubject={query.subject} initialTopic={query.topic} />;
}
