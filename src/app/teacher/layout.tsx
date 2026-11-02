import { DesignStyles } from "@/components/DesignStyles";
import { TeacherShell } from "@/components/TeacherShell";

export default function TeacherLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <DesignStyles href="/design/teacher/teacher.css" />
      <TeacherShell>{children}</TeacherShell>
    </>
  );
}
