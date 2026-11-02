import { DesignStyles } from "@/components/DesignStyles";
import { StudentShell } from "@/components/StudentShell";

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <DesignStyles href="/design/student/student.css" />
      <StudentShell>{children}</StudentShell>
    </>
  );
}
