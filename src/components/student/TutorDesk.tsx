"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ResourceCards } from "@/components/student/ResourceCards";
import { ApiError, postJson } from "@/lib/api-client";
import { demoTutorReply } from "@/lib/demo";
import { levelLabel } from "@/lib/student-format";
import type { ResourceBundle, TutorCard, TutorMessage } from "@/lib/types";

type Reply = { demo?: boolean; message: TutorMessage; resources?: ResourceBundle | null };

const SCHOOL_LEVELS = [
  { id: "100L", label: "100L" },
  { id: "200L", label: "200L" },
  { id: "300L", label: "300L" },
];

const LEARNING_LEVELS = [
  { id: "beginner", label: "Beginner" },
  { id: "intermediate", label: "Intermediate" },
  { id: "advanced", label: "Advanced" },
];

const SUBJECTS = ["Prompt engineering", "Software engineering", "Web APIs", "Machine learning"];

export function TutorDesk({ tutor, persistedId }: { tutor?: TutorCard; persistedId?: string }) {
  const lockedCourse = Boolean(persistedId);
  const [level, setLevel] = useState(tutor?.level ?? "200L");
  const [subject, setSubject] = useState(tutor?.subject ?? "Prompt engineering");
  const [topic, setTopic] = useState(tutor?.topic ?? "System prompts");
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [locked, setLocked] = useState(false);
  const [demo, setDemo] = useState(false);
  const [modeUsed, setModeUsed] = useState<string>("");
  const [resources, setResources] = useState<ResourceBundle | null>(null);
  const opening = useMemo(() => openingThread(tutor, lockedCourse), [tutor, lockedCourse]);
  const [messages, setMessages] = useState<TutorMessage[]>(opening);
  const levels = lockedCourse ? LEARNING_LEVELS : SCHOOL_LEVELS;
  const subjects = lockedCourse ? [subject] : Array.from(new Set([subject, ...SUBJECTS]));
  const practice = practiceTarget(subject, topic, persistedId);
  let latestIndex = -1;
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    if (messages[index]?.role === "tutor") {
      latestIndex = index;
      break;
    }
  }

  async function ask(message: string, mode?: "explain" | "simpler" | "example" | "diagram") {
    const text = message.trim();
    if (text.length < 2 || busy || locked) return;
    setError("");
    setBusy(true);
    setModeUsed(mode ?? "");
    setMessages((current) => [...current, { role: "user", short: text, steps: [], remember: "" }]);
    setDraft("");
    try {
      const data = await postJson<Reply>("/api/tutor/chat", {
        tutorId: persistedId,
        level,
        subject,
        topic,
        message: text,
        mode,
      });
      setDemo(Boolean(data.demo));
      setResources(data.resources ?? null);
      setMessages((current) => [...current, data.message]);
    } catch (caught) {
      if (caught instanceof ApiError && caught.status === 423) {
        setLocked(true);
        setError(caught.message);
        return;
      }
      if (caught instanceof ApiError && (caught.status === 400 || caught.status === 404)) {
        setError(caught.message);
        return;
      }
      setMessages((current) => [...current, demoTutorReply({ subject, topic, message: text, mode })]);
      setDemo(true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Link className="back" href={lockedCourse ? "/student/tutors" : "/student"}>
        {lockedCourse ? "← My tutors" : "← Home"}
      </Link>
      {tutor?.name ? <h1 style={{ marginTop: 12 }}>{tutor.name}</h1> : null}
      <section className="card" style={{ marginTop: 12 }}>
        <div className="two">
          <div>
            <label htmlFor="level">Level</label>
            <select id="level" value={level} disabled={lockedCourse} onChange={(event) => setLevel(event.target.value)}>
              {levels.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="subject">Course</label>
            {lockedCourse ? (
              <p id="subject" style={{ margin: "8px 0 0", color: "var(--kn-ink)", fontWeight: 500 }}>
                {subject}
              </p>
            ) : (
              <select id="subject" value={subject} onChange={(event) => setSubject(event.target.value)}>
                {subjects.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            )}
          </div>
        </div>
        {lockedCourse ? (
          <p className="meta" style={{ marginTop: 8 }}>
            {levelLabel(level)} · this tutor stays on {subject}.
          </p>
        ) : null}
        <label htmlFor="topic" style={{ marginTop: 10 }}>
          Topic
        </label>
        <input id="topic" value={topic} onChange={(event) => setTopic(event.target.value)} />
      </section>

      <section className="card" style={{ padding: 0, overflow: "hidden" }}>
        <div className="frame-bar">
          <i style={{ background: "var(--kn-dot-blue)" }} />
          <i style={{ background: "var(--kn-dot-orange)" }} />
          <i style={{ background: "var(--kn-dot-yellow)" }} />
        </div>
        <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 14 }}>
          {messages.map((message, index) =>
            message.role === "user" ? (
              <div
                key={`${message.role}-${index}`}
                style={{
                  alignSelf: "flex-end",
                  maxWidth: "85%",
                  background: "var(--kn-orange-soft)",
                  color: "var(--kn-ink)",
                  padding: "10px 14px",
                  borderRadius: "16px 16px 4px 16px",
                }}
              >
                {message.short}
              </div>
            ) : (
              <div key={`${message.role}-${index}`} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                <TutorFace />
                <div className="bubble" style={{ flex: 1 }}>
                  <h3 style={{ marginBottom: 6 }}>Short answer</h3>
                  <p>{message.short}</p>
                  {message.steps.length > 0 ? (
                    <>
                      <h3 style={{ margin: "12px 0 6px" }}>Step by step</h3>
                      <ol style={{ paddingLeft: 18 }}>
                        {message.steps.map((step) => (
                          <li key={step}>{step}</li>
                        ))}
                      </ol>
                    </>
                  ) : null}
                  {message.remember ? (
                    <>
                      <h3 style={{ margin: "12px 0 6px" }}>Remember it</h3>
                      <p>{message.remember}</p>
                    </>
                  ) : null}
                  {message.next ? (
                    <>
                      <h3 style={{ margin: "12px 0 6px" }}>Next</h3>
                      <p>{message.next}</p>
                    </>
                  ) : null}
                  {index === latestIndex ? (
                    <div className="chips" style={{ marginTop: 12 }}>
                      <button
                        className={modeUsed === "simpler" ? "chip on" : "chip"}
                        type="button"
                        disabled={busy || locked}
                        onClick={() => ask(`Explain ${topic} more simply`, "simpler")}
                      >
                        Ask simpler
                      </button>
                      <button
                        className={modeUsed === "example" ? "chip on" : "chip"}
                        type="button"
                        disabled={busy || locked}
                        onClick={() => ask(`Give an example of ${topic}`, "example")}
                      >
                        Give an example
                      </button>
                      <button
                        className={modeUsed === "diagram" ? "chip on" : "chip"}
                        type="button"
                        disabled={busy || locked}
                        onClick={() => ask(`Explain a diagram of ${topic}`, "diagram")}
                      >
                        Explain the diagram
                      </button>
                    </div>
                  ) : null}
                </div>
              </div>
            ),
          )}
          <div className="card" style={{ margin: 0, background: "var(--kn-cream)" }}>
            <h3>Check yourself</h3>
            <p className="meta" style={{ marginBottom: 10 }}>
              {practice.note}
            </p>
            <Link className="btn btn-primary btn-block" href={practice.href}>
              {practice.label}
            </Link>
          </div>
          {resources ? (
            <div>
              <h3 style={{ marginBottom: 8 }}>Resources</h3>
              <ResourceCards items={[...resources.primary, ...resources.alternates]} />
            </div>
          ) : null}
          {demo ? <p className="meta">Demo answer. No model key is set, so this stays a practice reply.</p> : null}
          {locked ? (
            <p className="note">
              Tutor chat is locked until you submit the test. <Link href="/student/tests">Open Test Centre</Link>
            </p>
          ) : null}
          {error && !locked ? <p className="meta">{error}</p> : null}
          {busy ? <p className="meta">Writing the explanation.</p> : null}
        </div>
      </section>
      <form
        className="row"
        style={{ position: "sticky", bottom: 78 }}
        onSubmit={(event) => {
          event.preventDefault();
          void ask(draft);
        }}
      >
        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Ask about this topic"
          style={{ borderRadius: 999, borderColor: "var(--kn-ink)" }}
          aria-label="Ask about this topic"
          disabled={locked}
        />
        <button className="btn btn-ghost" style={{ padding: "12px 16px", background: "var(--kn-surface)" }} type="submit" disabled={busy || locked}>
          Send
        </button>
      </form>
    </>
  );
}

function TutorFace() {
  return (
    <svg width="40" height="32" viewBox="0 0 110 90" aria-hidden="true">
      <path d="M20 70C2 70 0 48 14 42 8 24 30 14 40 24 46 6 72 8 74 24 92 18 106 34 96 48 110 58 98 78 82 72 74 86 50 84 46 74 36 82 22 80 20 70Z" fill="#2412B0" />
      <ellipse cx="46" cy="40" rx="7" ry="10" fill="#fff" />
      <ellipse cx="62" cy="40" rx="7" ry="10" fill="#fff" />
      <circle cx="49" cy="42" r="4" />
      <circle cx="65" cy="42" r="4" />
    </svg>
  );
}

function openingThread(tutor: TutorCard | undefined, persisted: boolean): TutorMessage[] {
  if (!persisted && (!tutor || tutor.id === "prompts" || tutor.subject === "Prompt engineering")) {
    return [
      { role: "user", short: "Why does a system prompt sit above the user message?", steps: [], remember: "" },
      demoTutorReply({
        subject: "Prompt engineering",
        topic: "System prompts",
        message: "Why does a system prompt sit above the user message?",
      }),
    ];
  }
  if (tutor?.preview) return [{ role: "tutor", short: tutor.preview, steps: [], remember: "" }];
  return [{ role: "tutor", short: "Ask a question on this course.", steps: [], remember: "" }];
}

function practiceTarget(subject: string, topic: string, persistedId?: string) {
  if (!persistedId && (subject === "Prompt engineering" || /few-shot|system prompt/i.test(topic))) {
    return { href: "/student/quiz/few-shot", label: "Start practice", note: "3 quick questions on this answer" };
  }
  if (!persistedId && (subject === "Web APIs" || /fetch|http/i.test(topic))) {
    return { href: "/student/quiz/fetch", label: "Start practice", note: "3 quick questions on this answer" };
  }
  const params = new URLSearchParams({ course: subject, count: "5" });
  if (persistedId) params.set("tutor", persistedId);
  if (topic) params.set("topic", topic);
  return {
    href: `/student/tests?${params.toString()}`,
    label: "Start test",
    note: "5 questions in Test Centre. Tutor chat locks until you submit.",
  };
}
