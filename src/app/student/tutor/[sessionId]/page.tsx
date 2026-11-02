import { TutorDesk } from "@/components/student/TutorDesk";
import { PersistedTutor } from "@/components/student/PersistedTutor";
import { tutors } from "@/lib/demo";

export default async function TutorSessionPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;
  const tutor = tutors.find((item) => item.id === sessionId);
  if (!tutor) return <PersistedTutor tutorId={sessionId} />;
  return <TutorDesk tutor={tutor} />;
}
