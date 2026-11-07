import { DesignStyles } from "@/components/DesignStyles";
import { StudentShell } from "@/components/StudentShell";
import { loadStudentProfile } from "@/lib/profile-server";
import { requireSignedIn } from "@/lib/require-user";

export const dynamic = "force-dynamic";

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  await requireSignedIn();
  const profile = await loadStudentProfile();
  return (
    <>
      <DesignStyles href="/design/student/student.css" />
      <StudentShell name={profile.greetingName} username={profile.username} avatarUrl={profile.avatarUrl}>
        {children}
      </StudentShell>
    </>
  );
}
