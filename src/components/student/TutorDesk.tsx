"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { postJson } from "@/lib/api-client";
import { demoTutorReply } from "@/lib/demo";
import type { ResourceBundle, TutorCard, TutorMessage } from "@/lib/types";

type Reply = { demo?: boolean; message: TutorMessage; resources?: ResourceBundle | null };

const LEVELS = ["SS1", "SS2", "SS3"];
const SUBJECTS = ["Biology", "Mathematics", "Physics", "English"];

export function TutorDesk({ tutor, persistedId }: { tutor?: TutorCard; persistedId?: string }) {
  const [level, setLevel] = useState(tutor?.level ?? "SS2");
  const [subject, setSubject] = useState(tutor?.subject ?? "Biology");
  const [topic, setTopic] = useState(tutor?.topic ?? "Photosynthesis");
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [demo, setDemo] = useState(false);
  const [resources, setResources] = useState<ResourceBundle | null>(null);
  const opening = useMemo(() => openingThread(tutor), [tutor]);
  const [messages, setMessages] = useState<TutorMessage[]>(opening);

  async function ask(message: string, mode?: "explain" | "simpler" | "example" | "diagram") {
    const text = message.trim();
    if (text.length < 2) return;
    setError("");
    setBusy(true);
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
      const fallback = demoTutorReply({ subject, topic, message: text, mode });
      setMessages((current) => [...current, fallback]);
      setError(caught instanceof Error ? caught.message : "The tutor paused. Here is a practice reply.");
    } finally {
      setBusy(false);
    }
  }

  const latest = [...messages].reverse().find((message) => message.role === "tutor");

  return (
    <>
      <Link className="back" href="/student">
        ← Home
      </Link>
      <section className="card" style={{ marginTop: 12 }}>
        <div className="two">
          <div>
            <label htmlFor="level">Level</label>
            <select id="level" value={level} onChange={(event) => setLevel(event.target.value)}>
              {LEVELS.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="subject">Subject</label>
            <select id="subject" value={subject} disabled={Boolean(persistedId)} onChange={(event) => setSubject(event.target.value)}>
              {persistedId ? <option>{subject}</option> : null}
              {SUBJECTS.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </div>
        </div>
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
                <svg width="40" height="32" viewBox="0 0 110 90" aria-hidden="true">
                  <path d="M20 70C2 70 0 48 14 42 8 24 30 14 40 24 46 6 72 8 74 24 92 18 106 34 96 48 110 58 98 78 82 72 74 86 50 84 46 74 36 82 22 80 20 70Z" fill="#2412B0" />
                  <ellipse cx="46" cy="40" rx="7" ry="10" fill="#fff" />
                  <ellipse cx="62" cy="40" rx="7" ry="10" fill="#fff" />
                  <circle cx="49" cy="42" r="4" />
                  <circle cx="65" cy="42" r="4" />
                </svg>
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
                </div>
              </div>
            ),
          )}
          {latest ? (
            <div className="chips">
              <button className="chip" type="button" disabled={busy} onClick={() => ask(`Explain ${topic} more simply`, "simpler")}>
                Ask simpler
              </button>
              <button className="chip" type="button" disabled={busy} onClick={() => ask(`Give an example of ${topic}`, "example")}>
                Give an example
              </button>
              <button className="chip" type="button" disabled={busy} onClick={() => ask(`Explain a diagram of ${topic}`, "diagram")}>
                Explain the diagram
              </button>
            </div>
          ) : null}
          <div className="card" style={{ margin: 0, background: "var(--kn-cream)" }}>
            <h3>Check yourself</h3>
            <p className="meta" style={{ marginBottom: 10 }}>
              3 quick questions on this answer
            </p>
            <Link className="btn btn-primary btn-block" href={practiceHref(subject, topic)}>
              Start practice
            </Link>
          </div>
          {demo ? <p className="meta">Demo answer. Add GROQ_API_KEY to use the model.</p> : null}
          {resources ? (
            <div className="card" style={{ margin: 0 }}>
              <h3>Resources</h3>
              {[...resources.primary, ...resources.alternates].map((item) => (
                <p key={`${item.role}-${item.title}`} className="meta">
                  <span className="type">{item.type}</span> {item.title}
                  {item.verified && item.url ? (
                    <>
                      {" "}
                      <a href={item.url}>Open</a> <span className="ok">Checked link</span>
                    </>
                  ) : (
                    <> · {item.searchQuery}</>
                  )}
                </p>
              ))}
            </div>
          ) : null}
          {error ? <p className="meta">{error}</p> : null}
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
        />
        <button className="btn btn-ghost" style={{ padding: "12px 16px", background: "var(--kn-surface)" }} type="submit" disabled={busy}>
          Send
        </button>
      </form>
    </>
  );
}

function openingThread(tutor?: TutorCard): TutorMessage[] {
  if (!tutor || tutor.subject === "Biology") {
    return [
      { role: "user", short: "Why do plants need light to make food?", steps: [], remember: "" },
      demoTutorReply({
        subject: "Biology",
        topic: "Photosynthesis",
        message: "Why do plants need light to make food?",
      }),
    ];
  }
  return [{ role: "tutor", short: tutor.preview, steps: [], remember: "" }];
}

function practiceHref(subject: string, topic: string) {
  if (/photo/i.test(topic) || subject === "Biology") return "/student/quiz/photosynthesis";
  if (/quad/i.test(topic) || subject === "Mathematics") return "/student/quiz/quadratics";
  return "/student/quiz/photosynthesis";
}
