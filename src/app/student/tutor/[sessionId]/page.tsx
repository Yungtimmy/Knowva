import { TutorDesk } from "@/components/student/TutorDesk";
import { PersistedTutor } from "@/components/student/PersistedTutor";
import { tutors } from "@/lib/demo";

export default async function TutorSessionPage({
  params,
  searchParams,
}: {
  params: Promise<{ sessionId: string }>;
  searchParams: Promise<{ search?: string }>;
}) {
  const { sessionId } = await params;
  const query = await searchParams;
  const openSearch = query.search === "1";
  const tutor = tutors.find((item) => item.id === sessionId);
  if (!tutor) return <PersistedTutor tutorId={sessionId} openSearch={openSearch} />;
  return <TutorDesk tutor={tutor} openSearch={openSearch} />;
}
