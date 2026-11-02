"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/teacher", label: "Home", match: (path: string) => path === "/teacher" },
  { href: "/teacher/lesson/new", label: "Lesson outlines", match: (path: string) => path.startsWith("/teacher/lesson") },
  { href: "/teacher/quiz/new", label: "Quizzes and marking", match: (path: string) => path.startsWith("/teacher/quiz") },
  { href: "/teacher/class", label: "Class insights", match: (path: string) => path.startsWith("/teacher/class") },
];

export function TeacherShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <div className="shell">
      <aside className="side">
        <Link className="logo" href="/teacher">
          Knowva
        </Link>
        <span className="role">Teacher</span>
        {LINKS.map((link) => (
          <Link key={link.label} className={link.match(pathname) ? "nav on" : "nav"} href={link.href}>
            <span />
            {link.label}
          </Link>
        ))}
        <p className="foot">Every draft is a starting point. Review and edit before classroom use.</p>
      </aside>
      <main>{children}</main>
    </div>
  );
}
