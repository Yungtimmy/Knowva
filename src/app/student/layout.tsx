import { DesignStyles } from "@/components/DesignStyles";
import { StudentShell } from "@/components/StudentShell";
import { requireSignedIn } from "@/lib/require-user";

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  await requireSignedIn();
  return (
    <>
      <DesignStyles href="/design/student/student.css" />
      <StudentShell>{children}</StudentShell>
    </>
  );
}
