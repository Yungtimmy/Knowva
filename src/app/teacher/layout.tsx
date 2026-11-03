import { DesignStyles } from "@/components/DesignStyles";
import { TeacherShell } from "@/components/TeacherShell";
import { requireSignedIn } from "@/lib/require-user";

export default async function TeacherLayout({ children }: { children: React.ReactNode }) {
  await requireSignedIn();
  return (
    <>
      <DesignStyles href="/design/teacher/teacher.css" />
      <TeacherShell>{children}</TeacherShell>
    </>
  );
}
