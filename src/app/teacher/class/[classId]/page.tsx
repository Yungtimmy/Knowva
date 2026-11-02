import { ClassBoard } from "@/components/teacher/ClassBoard";

export default async function ClassPage({ params }: { params: Promise<{ classId: string }> }) {
  const { classId } = await params;
  return <ClassBoard classId={classId} />;
}
