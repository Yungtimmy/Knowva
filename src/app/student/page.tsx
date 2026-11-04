"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { KnowvaClouds } from "@/components/KnowvaClouds";
import { Mascot, mascotFor } from "@/components/Mascot";
import { useGreetingName } from "@/components/StudentShell";
import { getJson } from "@/lib/api-client";
import { tutorTitle } from "@/lib/demo";
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

type Desk = {
  cards: TutorCard[];
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
  const name = useGreetingName();
  const [hello, setHello] = useState("");
  const [when, setWhen] = useState("");
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
      let streak = 0;
      let next: NextStep[] = saved
        ? [
            { href: `/student/tutor/${first?.id ?? ""}`, title: `Open ${first?.name ?? "your tutor"}`, detail: first?.course ?? "Your course" },
            { href: "/student/tests", title: "Start a test", detail: "Scores land on Progress" },
          ]
        : [{ href: "/student/tutors/new", title: "Create a tutor", detail: "Start with the course you need most" }];
      if (progress && progress.testsTaken > 0) {
        streak = streakDays(progress.history.map((item) => item.submittedAt ?? item.createdAt));
        next = nextSteps(progress);
      }
      setDesk({
        cards: tutors.map(savedCard),
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
        <h1>{hello ? `${hello}, ${name}` : name}</h1>
        <p>
          {desk && desk.cards.length > 0
            ? "Your tutors are on the desk. Pick one and keep going."
            : desk
              ? "No tutors yet. Create your first and it will show up here."
              : "Opening your desk."}
        </p>
      </section>
      {desk ? (
        <div className="dash-grid">
          <section className="stack" aria-label="Your tutors">
            {desk.cards.length === 0 ? (
              <div className="card empty-desk">
                <KnowvaClouds size="brand" />
                <h3>Your desk is empty</h3>
                <p className="meta">Pick a subject and a level, and your tutor is ready in a minute.</p>
                <Link className="btn btn-primary" href="/student/tutors/new">
                  Create a tutor
                </Link>
              </div>
            ) : null}
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
            {desk.cards.length > 0 ? (
              <Link className="add-tutor" href="/student/tutors/new">
                + Create a tutor
              </Link>
            ) : null}
          </section>
          <aside className="aside">
            {desk.cards.length > 0 ? (
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
            ) : null}
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
