"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Mascot } from "@/components/Mascot";
import { ApiError, getJson, postJson } from "@/lib/api-client";
import { chatMatchCount, groupMessagesByDay, matchSpans } from "@/lib/chat-thread";
import { demoTutorReply, tutorTitle } from "@/lib/demo";
import { mascotColorFor } from "@/lib/mascot-color";
import { clip } from "@/lib/student-format";
import type { ChatAttachment, TutorCard, TutorMessage } from "@/lib/types";

type Reply = { demo?: boolean; message: TutorMessage; messages?: TutorMessage[]; resources?: unknown };

const SEARCH_ICON = (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-4-4" />
  </svg>
);

export function TutorDesk({
  tutor,
  persistedId,
  mascotColor,
  openSearch = false,
  initialMessages,
  historyError = "",
}: {
  tutor?: TutorCard;
  persistedId?: string;
  mascotColor?: string;
  openSearch?: boolean;
  initialMessages?: TutorMessage[];
  historyError?: string;
}) {
  const subject = tutor?.subject ?? "Prompt engineering";
  const topic = tutor?.topic ?? "System prompts";
  const level = tutor?.level ?? "200L";
  const name = tutor?.name ?? tutorTitle(subject);
  const color = mascotColor || tutor?.mascotColor || mascotColorFor(subject, persistedId ?? tutor?.id ?? subject);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const seeded = initialMessages !== undefined;
  const [error, setError] = useState(historyError);
  const [locked, setLocked] = useState(false);
  const [demo, setDemo] = useState(false);
  const [modeUsed, setModeUsed] = useState("");
  const [historyReady, setHistoryReady] = useState(!persistedId || seeded);
  const [messages, setMessages] = useState<TutorMessage[]>(() => (persistedId ? (initialMessages ?? []) : openingThread(tutor)));
  const [searchOpen, setSearchOpen] = useState(openSearch);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (!persistedId || seeded) return;
    let cancel = false;
    getJson<{ messages: TutorMessage[] }>(`/api/tutors/${persistedId}/messages`)
      .then((data) => {
        if (!cancel) setMessages(data.messages);
      })
      .catch((caught: unknown) => {
        if (!cancel) setError(caught instanceof Error ? caught.message : "Could not load this chat.");
      })
      .finally(() => {
        if (!cancel) setHistoryReady(true);
      });
    return () => {
      cancel = true;
    };
  }, [persistedId, seeded]);

  const totalHits = useMemo(() => chatMatchCount(messages, query), [messages, query]);
  const activeHit = totalHits === 0 ? 0 : Math.min(activeIndex, totalHits - 1);
  const groups = useMemo(() => groupMessagesByDay(messages), [messages]);
  const practice = practiceTarget(subject, topic, persistedId);
  let latestIndex = -1;
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    if (messages[index]?.role === "tutor") {
      latestIndex = index;
      break;
    }
  }

  useEffect(() => {
    if (!searchOpen || query.trim().length < 2 || totalHits === 0) return;
    document.getElementById("hit-current")?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [searchOpen, query, activeHit, totalHits, messages]);

  async function ask(message: string, mode?: "explain" | "simpler" | "example" | "diagram") {
    const text = message.trim();
    if (text.length < 2 || busy || locked || !historyReady) return;
    setError("");
    setBusy(true);
    setModeUsed(mode ?? "");
    const optimistic: TutorMessage = {
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      role: "user",
      short: text,
      steps: [],
      remember: "",
    };
    setMessages((current) => [...current, optimistic]);
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
      if (data.messages && data.messages.length > 0) setMessages(data.messages);
      else setMessages((current) => [...current, data.message]);
    } catch (caught) {
      if (caught instanceof ApiError && caught.status === 423) {
        setLocked(true);
        setError(caught.message);
        return;
      }
      if (caught instanceof ApiError && (caught.status === 400 || caught.status === 404 || caught.status === 500)) {
        setError(caught.message);
        return;
      }
      setMessages((current) => [...current, demoTutorReply({ subject, topic, message: text, mode })]);
      setDemo(true);
    } finally {
      setBusy(false);
    }
  }

  let seenHits = 0;
  function renderText(text: string, key: string) {
    const spans = searchOpen ? matchSpans(text, query) : [];
    if (spans.length === 0) return text;
    const nodes: ReactNode[] = [];
    let cursor = 0;
    spans.forEach((span, index) => {
      if (span.start > cursor) nodes.push(text.slice(cursor, span.start));
      const current = seenHits === activeHit;
      nodes.push(
        <mark key={`${key}-${index}`} id={current ? "hit-current" : undefined} className={current ? "msg-hit cur" : "msg-hit"}>
          {text.slice(span.start, span.end)}
        </mark>,
      );
      seenHits += 1;
      cursor = span.end;
    });
    if (cursor < text.length) nodes.push(text.slice(cursor));
    return nodes;
  }

  const counter = query.trim().length < 2 ? "Type a word" : totalHits === 0 ? "0 of 0" : `${activeHit + 1} of ${totalHits}`;

  return (
    <>
      <header className="tutor-head">
        <Link className="back" href={persistedId ? "/student/tutors" : "/student"} aria-label={persistedId ? "Back to tutors" : "Back home"}>
          ←
        </Link>
        {persistedId ? (
          <Link className="th-ava" href={`/student/tutor/${persistedId}/media`} aria-label="Media from this chat">
            <Mascot color={color} />
          </Link>
        ) : (
          <span className="th-ava" aria-hidden="true">
            <Mascot color={color} />
          </span>
        )}
        <div className="th-id">
          <h2>{name}</h2>
          <p className="meta">
            {clip(topic, 42)} · {persistedId ? "history saved" : "sample chat"}
          </p>
        </div>
        <button
          className="th-btn"
          type="button"
          aria-label="Search this chat"
          aria-pressed={searchOpen}
          onClick={() => setSearchOpen((open) => !open)}
        >
          {SEARCH_ICON}
        </button>
      </header>
      {searchOpen ? (
        <div className="th-search">
          <input
            value={query}
            aria-label="Search this chat"
            autoFocus
            onChange={(event) => {
              setQuery(event.target.value);
              setActiveIndex(0);
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                if (totalHits === 0) return;
                setActiveIndex((current) => (event.shiftKey ? (current - 1 + totalHits) % totalHits : (current + 1) % totalHits));
              }
            }}
          />
          <span className="meta" aria-live="polite">
            {counter}
          </span>
          <button
            className="th-step"
            type="button"
            aria-label="Previous match"
            disabled={totalHits === 0}
            onClick={() => setActiveIndex((current) => (current - 1 + totalHits) % totalHits)}
          >
            ↑
          </button>
          <button
            className="th-step"
            type="button"
            aria-label="Next match"
            disabled={totalHits === 0}
            onClick={() => setActiveIndex((current) => (current + 1) % totalHits)}
          >
            ↓
          </button>
          <button
            className="th-step"
            type="button"
            aria-label="Close search"
            onClick={() => {
              setSearchOpen(false);
              setQuery("");
              setActiveIndex(0);
            }}
          >
            ×
          </button>
        </div>
      ) : null}

      <section className="thread" aria-label="Chat history">
        {!historyReady ? <p className="meta">Opening the chat.</p> : null}
        {historyReady && messages.length === 0 ? (
          <p className="meta" style={{ textAlign: "center" }}>
            Ask {name} something. This chat stays on this tutor.
          </p>
        ) : null}
        {groups.map((group) => (
          <div key={group.label + (group.messages[0]?.id ?? group.label)} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <p className="day-sep">{group.label}</p>
            {group.messages.map((message) => {
              const index = messages.indexOf(message);
              if (message.role === "user") {
                return (
                  <div key={message.id ?? `user-${index}`} id={message.id ? `msg-${message.id}` : undefined} className="bubble-me">
                    {renderText(message.short, message.id ?? `user-${index}`)}
                  </div>
                );
              }
              const latest = index === latestIndex;
              return (
                <div key={message.id ?? `tutor-${index}`} id={message.id ? `msg-${message.id}` : undefined} className="msg-tutor">
                  <Mascot color={color} />
                  <div className="bubble" style={{ flex: 1 }}>
                    <h3 style={{ marginBottom: 6 }}>Short answer</h3>
                    <p>{renderText(message.short, `${message.id}-short`)}</p>
                    {message.steps.length > 0 ? (
                      <>
                        <h3 style={{ margin: "12px 0 6px" }}>Step by step</h3>
                        <ol style={{ paddingLeft: 18 }}>
                          {message.steps.map((step, stepIndex) => (
                            <li key={`${message.id}-step-${stepIndex}`}>{renderText(step, `${message.id}-step-${stepIndex}`)}</li>
                          ))}
                        </ol>
                      </>
                    ) : null}
                    {message.remember ? (
                      <>
                        <h3 style={{ margin: "12px 0 6px" }}>Remember it</h3>
                        <p>{renderText(message.remember, `${message.id}-remember`)}</p>
                      </>
                    ) : null}
                    {message.next ? (
                      <>
                        <h3 style={{ margin: "12px 0 6px" }}>Next</h3>
                        <p>{renderText(message.next, `${message.id}-next`)}</p>
                      </>
                    ) : null}
                    <AttachmentList items={message.attachments} />
                    {latest ? (
                      <div className="chips" style={{ marginTop: 12 }}>
                        <button className={modeUsed === "simpler" ? "chip on" : "chip"} type="button" disabled={busy || locked} onClick={() => ask(`Explain ${topic} more simply`, "simpler")}>
                          Ask simpler
                        </button>
                        <button className={modeUsed === "example" ? "chip on" : "chip"} type="button" disabled={busy || locked} onClick={() => ask(`Give an example of ${topic}`, "example")}>
                          Give an example
                        </button>
                        <Link className="chip" href={practice.href}>
                          Quick check
                        </Link>
                      </div>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
        {demo ? <p className="meta">Demo answer. No model key is set, so this stays a practice reply.</p> : null}
        {locked ? (
          <p className="note">
            Tutor chat is locked until you submit the test. <Link href="/student/tests">Open Test Centre</Link>
          </p>
        ) : null}
        {error && !locked ? <p className="meta">{error}</p> : null}
        {busy ? <p className="meta">Writing the explanation.</p> : null}
      </section>
      <form
        className="composer"
        onSubmit={(event) => {
          event.preventDefault();
          void ask(draft);
        }}
      >
        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder={`Ask ${name}`}
          aria-label={`Ask ${name}`}
          disabled={locked || !historyReady}
        />
        <button className="btn btn-primary btn-sm" type="submit" disabled={busy || locked || !historyReady}>
          Send
        </button>
      </form>
    </>
  );
}

function AttachmentList({ items }: { items?: ChatAttachment[] }) {
  if (!items || items.length === 0) return null;
  return (
    <>
      {items.map((item) => (
        <a className="att" key={item.url} href={item.url} target="_blank" rel="noreferrer">
          <b>{item.kind === "pdf" ? "PDF" : item.kind === "image" ? "Image" : "Link"}</b>
          {item.title}
        </a>
      ))}
    </>
  );
}

function openingThread(tutor: TutorCard | undefined): TutorMessage[] {
  const now = new Date().toISOString();
  if (!tutor || tutor.id === "prompts" || tutor.subject === "Prompt engineering") {
    return [
      { id: "opening-user", createdAt: now, role: "user", short: "Why does a system prompt sit above the user message?", steps: [], remember: "" },
      {
        ...demoTutorReply({
          subject: "Prompt engineering",
          topic: "System prompts",
          message: "Why does a system prompt sit above the user message?",
        }),
        id: "opening-tutor",
        createdAt: now,
      },
    ];
  }
  if (tutor.preview) return [{ id: "opening-preview", createdAt: now, role: "tutor", short: tutor.preview, steps: [], remember: "" }];
  return [{ id: "opening-empty", createdAt: now, role: "tutor", short: "Ask a question on this course.", steps: [], remember: "" }];
}

function practiceTarget(subject: string, topic: string, persistedId?: string) {
  if (!persistedId && (subject === "Prompt engineering" || /few-shot|system prompt/i.test(topic))) {
    return { href: "/student/quiz/few-shot" };
  }
  if (!persistedId && (subject === "Web APIs" || /fetch|http/i.test(topic))) {
    return { href: "/student/quiz/fetch" };
  }
  const params = new URLSearchParams({ course: subject, count: "5" });
  if (persistedId) params.set("tutor", persistedId);
  if (topic) params.set("topic", topic);
  return { href: `/student/tests?${params.toString()}` };
}
