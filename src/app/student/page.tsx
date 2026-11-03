"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Mascot, mascotFor } from "@/components/Mascot";
import { getJson } from "@/lib/api-client";
import { DEMO_DATE_SHORT, tutorTitle, tutors as sampleTutors } from "@/lib/demo";
import { cardTime, clip, deskDate, greeting, levelLabel, streakDays } from "@/lib/student-format";
import type { ProgressReport, Tutor, TutorCard, TutorStatus } from "@/lib/types";

const STATUS_CLASS: Record<TutorStatus, string> = {
  in_lesson: "s-lesson",
  needs_review: "s-review",
  ready: "s-ready",
};

const STATUS_LABEL: Record<TutorStatus, string> = {
  in_lesson: "In a lesson",
  needs_review: "Needs review",
  ready: "Ready",
};

const CYCLE = [
  { variant: "blue" as const, smile: true, tile: "#F7F4EC" },
  { variant: "orange" as const, smile: false, tile: "#F7F4EC" },
  { variant: "yellow" as const, smile: true, tile: "#F7F4EC" },
  { variant: "ink" as const, smile: false, tile: "#1C1B19" },
];

const KNOWN = new Set(["Prompt engineering", "Software engineering", "Web APIs", "Machine learning"]);

type NextStep = { href: string; title: string; detail: string };

const SAMPLE_NEXT: NextStep[] = [
  { href: "/student/tutor/python", title: "Revise failing tests", detail: "Software engineering · scored 2/5" },
  { href: "/student/quiz/few-shot", title: "Retake the few-shot quiz", detail: "Prompt engineering · last try 2/4" },
];

type Desk = {
  cards: TutorCard[];
  sample: boolean;
  streak: number;
  next: NextStep[];
};

function faceFor(subject: string, index: number) {
  if (KNOWN.has(subject)) return mascotFor(subject);
  return CYCLE[index % CYCLE.length] ?? CYCLE[0];
}

function savedCard(tutor: Tutor): TutorCard {
  return {
    id: tutor.id,
    name: tutor.name,
    subject: tutor.course,
    level: levelLabel(tutor.level),
    topic: clip(tutor.focus, 48),
    status: "ready",
    preview: clip(tutor.focus, 120),
    updatedAt: cardTime(tutor.updatedAt),
  };
}

function nextSteps(report: ProgressReport): NextStep[] {
  const steps = report.weakTopics.slice(0, 2).map((topic) => ({
    href: topic.tutorId ? `/student/tutor/${topic.tutorId}` : "/student/tutors",
    title: `Revise ${clip(topic.topic, 42)}`,
    detail: `${topic.tutorName ?? topic.course} · ${topic.percent}%`,
  }));
  if (steps.length === 0) {
    return [
      { href: "/student/tests", title: "Start a test", detail: "Test Centre" },
      { href: "/student/progress", title: "See topic scores", detail: `${report.testsTaken} tests taken` },
    ];
  }
  if (steps.length === 1) {
    steps.push({ href: "/student/tests", title: "Start a test", detail: "Test Centre" });
  }
  return steps;
}

export default function StudentHomePage() {
  const [hello, setHello] = useState("Morning");
  const [when, setWhen] = useState(DEMO_DATE_SHORT);
  const [desk, setDesk] = useState<Desk | null>(null);

  useEffect(() => {
    setHello(greeting());
    setWhen(deskDate());
    let cancel = false;
    Promise.allSettled([
      getJson<{ tutors: Tutor[] }>("/api/tutors"),
      getJson<{ progress: ProgressReport }>("/api/progress"),
    ]).then(([tutorResult, progressResult]) => {
      if (cancel) return;
      const tutors = tutorResult.status === "fulfilled" ? tutorResult.value.tutors : [];
      const progress = progressResult.status === "fulfilled" ? progressResult.value.progress : null;
      const saved = tutors.length > 0;
      const first = tutors[0];
      let streak = saved ? 0 : 5;
      let next = SAMPLE_NEXT;
      if (progress && progress.testsTaken > 0) {
        streak = streakDays(progress.history.map((item) => item.submittedAt ?? item.createdAt));
        next = nextSteps(progress);
      } else if (saved && first) {
        next = [
          { href: `/student/tutor/${first.id}`, title: `Open ${first.name}`, detail: first.course },
          { href: "/student/tests", title: "Start a test", detail: "Scores land on Progress" },
        ];
      }
      setDesk({
        cards: saved ? tutors.map(savedCard) : sampleTutors,
        sample: !saved,
        streak,
        next,
      });
    });
    return () => {
      cancel = true;
    };
  }, []);

  return (
    <>
      <section className="hello">
        <p className="meta">{when}</p>
        <h1>
          {hello}, Ada
        </h1>
        <p>Your tutors are on the desk. Pick one and keep going.</p>
      </section>
      {desk ? (
        <div className="dash-grid">
          <section className="stack" aria-label={desk.sample ? "Sample tutors" : "Your tutors"}>
            {desk.cards.map((tutor, index) => {
              const face = faceFor(tutor.subject, index);
              const href = `/student/tutor/${tutor.id}`;
              return (
                <article
                  key={tutor.id}
                  className={`tcard ${STATUS_CLASS[tutor.status]}`}
                  style={{ ["--z" as string]: 10 - index }}
                  tabIndex={0}
                >
                  <div className="tc-head">
                    <div className="tc-face" style={{ background: face.tile }}>
                      <Mascot variant={face.variant} smile={face.smile} />
                    </div>
                    <div className="tc-id">
                      <h3>{tutor.name ?? tutorTitle(tutor.subject)}</h3>
                      <p className="meta">
                        {tutor.level} · {tutor.topic}
                      </p>
                    </div>
                    <span className="tc-time">{tutor.updatedAt}</span>
                  </div>
                  <div className="tc-body">
                    <span className="status">
                      <i />
                      {STATUS_LABEL[tutor.status]}
                    </span>
                    <p>{tutor.preview}</p>
                  </div>
                  <div className="tc-foot">
                    <Link className="btn btn-ghost btn-sm" href={href}>
                      Expand
                    </Link>
                    {tutor.status === "in_lesson" ? (
                      <Link className="btn btn-primary btn-sm" href={href}>
                        Continue lesson
                      </Link>
                    ) : (
                      <Link className="tc-link" href={href}>
                        Open tutor
                      </Link>
                    )}
                  </div>
                </article>
              );
            })}
            <Link className="add-tutor" href="/student/tutors/new">
              + Create a tutor
            </Link>
          </section>
          <aside className="aside">
            <div className="mini">
              <div>
                <p className="meta">Study streak</p>
                <b>
                  {desk.streak} {desk.streak === 1 ? "day" : "days"}
                </b>
              </div>
              <div className="dots" aria-label={`${desk.streak} day streak`}>
                {Array.from({ length: 7 }, (_, index) => (
                  <i key={index} className={index < Math.min(desk.streak, 7) ? "on" : undefined} />
                ))}
              </div>
            </div>
            <div className="mini col">
              <p className="meta">Do this next</p>
              {desk.next.map((item) => (
                <Link key={item.href + item.title} href={item.href}>
                  <b>{item.title}</b>
                  <span>{item.detail}</span>
                </Link>
              ))}
            </div>
          </aside>
        </div>
      ) : (
        <p className="meta">Opening your desk.</p>
      )}
    </>
  );
}
