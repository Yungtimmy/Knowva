"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { id: "home", href: "/student", label: "Home" },
  { id: "tutors", href: "/student/tutors", label: "Tutors" },
  { id: "learn", href: "/student/learn", label: "Learn" },
  { id: "tests", href: "/student/tests", label: "Tests" },
  { id: "progress", href: "/student/progress", label: "Progress" },
] as const;

function tabId(pathname: string) {
  if (pathname.startsWith("/student/quiz")) return "tests";
  if (pathname.startsWith("/student/tutors") || pathname.startsWith("/student/tutor")) return "tutors";
  if (pathname.startsWith("/student/learn") || pathname.startsWith("/student/materials")) return "learn";
  if (pathname.startsWith("/student/tests")) return "tests";
  if (pathname.startsWith("/student/progress")) return "progress";
  return "home";
}

function testInProgress(pathname: string) {
  return /^\/student\/tests\/[^/]+$/.test(pathname);
}

function headerKind(pathname: string) {
  if (testInProgress(pathname)) return "lock";
  if (pathname.startsWith("/student/tutors/new")) return "tutors";
  if (/^\/student\/tests\/[^/]+\/results\/?$/.test(pathname)) return "tests";
  return "logo";
}

export function StudentShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const active = tabId(pathname);
  const kind = headerKind(pathname);
  const practice = pathname.startsWith("/student/quiz");
  return (
    <>
      <main className={active === "home" && kind !== "lock" ? "app dash" : "app"}>
        {practice ? (
          <p className="meta" style={{ marginBottom: 8 }}>
            Practice quiz · not graded as a test
          </p>
        ) : null}
        <header className="top">
          {kind === "lock" ? (
            <span className="lock">Test in progress · tutor locked</span>
          ) : kind === "tutors" ? (
            <Link className="back" href="/student/tutors">
              ← My tutors
            </Link>
          ) : kind === "tests" ? (
            <Link className="back" href="/student/tests">
              ← Test Centre
            </Link>
          ) : (
            <Link className="logo" href="/student">
              <svg width="18" height="12" viewBox="0 0 22 14" aria-hidden="true">
                <path d="M11 0 22 5 11 10 0 5Z" fill="#FF4A1C" transform="rotate(-14 11 5)" />
                <path d="M5 8v4h10V8" fill="#FF4A1C" transform="rotate(-14 11 5)" />
              </svg>
              Knowva
            </Link>
          )}
          {kind === "lock" ? (
            <span className="meta">Untimed</span>
          ) : (
            <Link href="/login" className="avatar" style={{ textDecoration: "none" }} aria-label="Account">
              AO
            </Link>
          )}
        </header>
        {children}
      </main>
      {kind === "lock" ? null : (
        <nav className="tabbar" aria-label="Student">
          {TABS.map((tab) => (
            <Link
              key={tab.id}
              href={tab.href}
              className={active === tab.id ? "on" : undefined}
              aria-current={active === tab.id ? "page" : undefined}
            >
              <TabIcon id={tab.id} />
              {tab.label}
            </Link>
          ))}
        </nav>
      )}
    </>
  );
}

function TabIcon({ id }: { id: (typeof TABS)[number]["id"] }) {
  if (id === "home") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M3 10.5 12 3l9 7.5" />
        <path d="M5 9.5V21h14V9.5" />
        <path d="M9 21v-7h6v7" />
      </svg>
    );
  }
  if (id === "tutors") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.4 8.4 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8v.5z" />
      </svg>
    );
  }
  if (id === "learn") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
        <path d="M8 7h8M8 11h6" />
      </svg>
    );
  }
  if (id === "tests") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
        <path d="M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v0a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2z" />
        <path d="m9 14 2 2 4-4" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 19V5" />
      <path d="M4 19h16" />
      <path d="M8 16v-4" />
      <path d="M12 16V8" />
      <path d="M16 16v-6" />
    </svg>
  );
}
