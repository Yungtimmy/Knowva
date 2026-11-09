"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Mascot } from "@/components/Mascot";
import { ApiError, getJson, postJson } from "@/lib/api-client";
import {
  CHAT_UPLOAD_ACCEPT,
  buildChatUploadPath,
  mimeForChatFile,
  pageLabel,
  takeChatFiles,
  validateChatFile,
} from "@/lib/chat-files";
import { chatMatchCount, groupMessagesByDay, matchSpans } from "@/lib/chat-thread";
import { chatAccessToken, removeChatObject, signedInUserId, uploadChatObject } from "@/lib/chat-upload-client";
import { demoTutorReply, tutorTitle } from "@/lib/demo";
import { mascotColorFor } from "@/lib/mascot-color";
import { clip } from "@/lib/student-format";
import type { ChatAttachment, TutorCard, TutorMessage } from "@/lib/types";

type LocalFile = {
  localId: string;
  name: string;
  kind: "pdf" | "image";
  mime: "application/pdf" | "image/png" | "image/jpeg" | "image/webp";
  size: number;
  progress: number;
  status: "uploading" | "ready" | "error";
  error?: string;
  path?: string;
  previewUrl?: string;
  abort?: () => void;
};

const PAPERCLIP = (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48" />
  </svg>
);

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
  const [files, setFiles] = useState<LocalFile[]>([]);
  const [attachError, setAttachError] = useState("");
  const [dragging, setDragging] = useState(false);
  const [quizId, setQuizId] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const dragDepth = useRef(0);
  const filesRef = useRef(files);
  filesRef.current = files;
  const router = useRouter();

  useEffect(() => {
    return () => {
      for (const file of filesRef.current) {
        if (file.previewUrl) URL.revokeObjectURL(file.previewUrl);
      }
    };
  }, []);

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

  async function addFiles(list: File[]) {
    if (locked || !historyReady || list.length === 0) return;
    setAttachError("");
    if (!persistedId) {
      setAttachError("Open a saved tutor to attach a file.");
      return;
    }
    const batch = takeChatFiles(files.length, list);
    if (batch.error) setAttachError(batch.error);
    if (batch.accepted.length === 0) return;
    const userId = await signedInUserId();
    const token = await chatAccessToken();
    if (!userId || !token) {
      setAttachError("Sign in to attach a file.");
      return;
    }
    for (const file of batch.accepted) {
      const check = validateChatFile({ name: file.name, type: mimeForChatFile(file), size: file.size });
      if (!check.ok) {
        setAttachError(`${file.name}: ${check.error}`);
        continue;
      }
      const localId = crypto.randomUUID();
      const path = buildChatUploadPath(userId, persistedId, crypto.randomUUID(), file.name);
      const previewUrl = check.kind === "image" ? URL.createObjectURL(file) : undefined;
      const upload = uploadChatObject({
        path,
        file,
        contentType: check.mime,
        accessToken: token,
        onProgress: (progress) => {
          setFiles((current) => current.map((item) => (item.localId === localId ? { ...item, progress } : item)));
        },
      });
      setFiles((current) => [
        ...current,
        {
          localId,
          name: file.name,
          kind: check.kind,
          mime: check.mime,
          size: file.size,
          progress: 0,
          status: "uploading",
          path,
          previewUrl,
          abort: upload.abort,
        },
      ]);
      void upload.done
        .then(() => {
          setFiles((current) =>
            current.map((item) => (item.localId === localId ? { ...item, status: "ready", progress: 100 } : item)),
          );
        })
        .catch((caught: unknown) => {
          if (caught instanceof Error && caught.message === "Upload cancelled.") return;
          const message = caught instanceof Error ? caught.message : "That upload did not finish.";
          setAttachError(`${file.name}: ${message}`);
          setFiles((current) =>
            current.map((item) => (item.localId === localId ? { ...item, status: "error", error: message } : item)),
          );
        });
    }
  }

  function removeFile(localId: string) {
    setFiles((current) => {
      const file = current.find((item) => item.localId === localId);
      file?.abort?.();
      if (file?.previewUrl) URL.revokeObjectURL(file.previewUrl);
      if (file?.path && file.status !== "uploading") void removeChatObject(file.path);
      return current.filter((item) => item.localId !== localId);
    });
    setAttachError("");
  }

  async function quizFrom(attachmentId: string) {
    if (!persistedId || quizId || busy) return;
    setQuizId(attachmentId);
    setError("");
    try {
      const data = await postJson<{ test: { id: string } }>("/api/tests", {
        course: subject,
        tutorId: persistedId,
        questionCount: 5,
        difficulty: "medium",
        topics: topic ? [topic.slice(0, 80)] : undefined,
        format: "multiple_choice",
        sourceAttachmentId: attachmentId,
      });
      router.push(`/student/tests/${data.test.id}`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not start the quiz.");
      setQuizId("");
    }
  }

  async function ask(message: string, mode?: "explain" | "simpler" | "example" | "diagram", attached?: LocalFile[]) {
    const text = message.trim();
    const ready = (attached ?? []).filter((file): file is LocalFile & { path: string } => file.status === "ready" && Boolean(file.path));
    if (text.length === 1 || (text.length < 2 && ready.length === 0) || busy || locked || !historyReady) return;
    if ((attached ?? []).some((file) => file.status === "uploading" || file.status === "error")) return;
    setError("");
    setBusy(true);
    setModeUsed(mode ?? "");
    const shown = text.length >= 2 ? text : `Look at ${ready.map((file) => file.name).join(", ")}.`;
    const optimistic: TutorMessage = {
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      role: "user",
      short: shown,
      steps: [],
      remember: "",
      attachments: ready.map((file) => ({
        kind: file.kind,
        title: file.name,
        url: file.previewUrl ?? "",
      })),
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
        uploads:
          ready.length > 0
            ? ready.map((file) => ({ path: file.path, filename: file.name, mime: file.mime, size: file.size }))
            : undefined,
      });
      setDemo(Boolean(data.demo));
      if (data.messages && data.messages.length > 0) setMessages(data.messages);
      else setMessages((current) => [...current, data.message]);
      if (ready.length > 0) {
        for (const file of ready) {
          if (file.previewUrl) URL.revokeObjectURL(file.previewUrl);
        }
        setFiles([]);
      }
    } catch (caught) {
      if (ready.length > 0) {
        setMessages((current) => current.filter((item) => item.id !== optimistic.id));
        setDraft(text);
        if (caught instanceof ApiError && caught.status === 423) setLocked(true);
        setError(caught instanceof Error ? caught.message : "Could not send that.");
        return;
      }
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

  const readyFiles = files.filter((file) => file.status === "ready" && file.path);
  const sendBlocked = files.some((file) => file.status !== "ready");
  const trimmedDraft = draft.trim();
  const canSend =
    !busy && !locked && historyReady && !sendBlocked && trimmedDraft.length !== 1 && (trimmedDraft.length >= 2 || readyFiles.length > 0);

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
    <div
      className={dragging ? "chat-drop drop-on" : "chat-drop"}
      onDragEnter={(event) => {
        if (![...event.dataTransfer.types].includes("Files")) return;
        event.preventDefault();
        dragDepth.current += 1;
        setDragging(true);
      }}
      onDragOver={(event) => {
        if ([...event.dataTransfer.types].includes("Files")) event.preventDefault();
      }}
      onDragLeave={() => {
        dragDepth.current = Math.max(0, dragDepth.current - 1);
        if (dragDepth.current === 0) setDragging(false);
      }}
      onDrop={(event) => {
        event.preventDefault();
        dragDepth.current = 0;
        setDragging(false);
        void addFiles([...event.dataTransfer.files]);
      }}
    >
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
                    {message.short ? renderText(message.short, message.id ?? `user-${index}`) : null}
                    <MessageFiles
                      items={message.attachments}
                      onQuiz={persistedId ? quizFrom : undefined}
                      quizId={quizId}
                    />
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
                    <MessageFiles items={message.attachments} quizId="" />
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
          void ask(draft, undefined, files);
        }}
      >
        {files.length > 0 ? (
          <div className="file-chips">
            {files.map((file) => (
              <div key={file.localId} className={file.status === "error" ? "file-chip bad" : "file-chip"}>
                {file.previewUrl ? <img src={file.previewUrl} alt="" /> : <b>{file.kind === "pdf" ? "PDF" : "Image"}</b>}
                <span className="file-chip-name">{file.name}</span>
                <span className="meta">{file.status === "error" ? "Failed" : file.status === "ready" ? "Ready" : `${file.progress}%`}</span>
                <button type="button" aria-label={`Remove ${file.name}`} onClick={() => removeFile(file.localId)}>
                  ×
                </button>
                {file.status === "uploading" ? <span className="file-chip-bar" style={{ width: `${file.progress}%` }} /> : null}
              </div>
            ))}
          </div>
        ) : null}
        {attachError ? (
          <p className="meta composer-note" role="alert">
            {attachError}
          </p>
        ) : null}
        <div className="composer-row">
          <button
            className="clip-btn"
            type="button"
            aria-label="Attach a PDF or image"
            disabled={locked || !historyReady || busy}
            onClick={() => fileRef.current?.click()}
          >
            {PAPERCLIP}
          </button>
          <input
            className="composer-input"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onPaste={(event) => {
              const images = [...event.clipboardData.files].filter((file) => file.type.startsWith("image/"));
              if (images.length === 0) return;
              event.preventDefault();
              void addFiles(images);
            }}
            placeholder={`Ask ${name}`}
            aria-label={`Ask ${name}`}
            disabled={locked || !historyReady}
          />
          <button className="btn btn-primary btn-sm" type="submit" disabled={!canSend}>
            Send
          </button>
        </div>
        <input
          ref={fileRef}
          className="file-input"
          type="file"
          multiple
          accept={CHAT_UPLOAD_ACCEPT}
          aria-hidden="true"
          tabIndex={-1}
          onChange={(event) => {
            const picked = [...(event.target.files ?? [])];
            event.target.value = "";
            void addFiles(picked);
          }}
        />
      </form>
    </div>
  );
}

function MessageFiles({
  items,
  onQuiz,
  quizId,
}: {
  items?: ChatAttachment[];
  onQuiz?: (attachmentId: string) => void;
  quizId: string;
}) {
  if (!items || items.length === 0) return null;
  return (
    <div className="msg-files">
      {items.map((item) => {
        const key = item.storagePath || item.attachmentId || item.url || item.title;
        if (item.kind === "image" && item.url) {
          return (
            <a key={key} className="msg-shot" href={item.url} target="_blank" rel="noreferrer">
              <img src={item.url} alt={item.title} />
            </a>
          );
        }
        if (item.kind === "pdf") {
          const pages = pageLabel(item.pages);
          const body = (
            <>
              <b>PDF</b>
              <span>
                {item.title}
                {pages ? <span className="meta"> · {pages}</span> : null}
              </span>
            </>
          );
          return (
            <div key={key} className="msg-pdf">
              {item.url ? (
                <a className="att" href={item.url} target="_blank" rel="noreferrer">
                  {body}
                </a>
              ) : (
                <div className="att">{body}</div>
              )}
              {onQuiz && item.attachmentId ? (
                <button className="chip" type="button" disabled={Boolean(quizId)} onClick={() => onQuiz(item.attachmentId ?? "")}>
                  {quizId === item.attachmentId ? "Writing the quiz" : "Quiz me on this"}
                </button>
              ) : null}
            </div>
          );
        }
        if (!item.url) return null;
        return (
          <a className="att" key={key} href={item.url} target="_blank" rel="noreferrer">
            <b>{item.kind === "image" ? "Image" : "Link"}</b>
            {item.title}
          </a>
        );
      })}
    </div>
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
