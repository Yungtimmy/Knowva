"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Mascot } from "@/components/Mascot";
import { getJson } from "@/lib/api-client";
import type { ChatAttachmentKind, Tutor, TutorMessage } from "@/lib/types";

const FILTERS: { id: "all" | ChatAttachmentKind; label: string }[] = [
  { id: "all", label: "All" },
  { id: "link", label: "Links" },
  { id: "pdf", label: "PDFs" },
  { id: "image", label: "Images" },
];

type MediaItem = {
  kind: ChatAttachmentKind;
  title: string;
  url: string;
  messageId: string;
};

export function TutorMedia({ tutorId }: { tutorId: string }) {
  const [tutor, setTutor] = useState<Tutor | null>(null);
  const [messages, setMessages] = useState<TutorMessage[]>([]);
  const [missing, setMissing] = useState(false);
  const [note, setNote] = useState("");
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["id"]>("all");

  useEffect(() => {
    let cancel = false;
    Promise.all([
      getJson<{ tutor: Tutor }>(`/api/tutors/${tutorId}`),
      getJson<{ messages: TutorMessage[] }>(`/api/tutors/${tutorId}/messages`),
    ])
      .then(([tutorData, messageData]) => {
        if (cancel) return;
        setTutor(tutorData.tutor);
        setMessages(messageData.messages);
      })
      .catch((error: unknown) => {
        if (cancel) return;
        const message = error instanceof Error ? error.message : "Could not open media.";
        if (/not found/i.test(message)) setMissing(true);
        else setNote(message);
      });
    return () => {
      cancel = true;
    };
  }, [tutorId]);

  const items = useMemo(() => {
    const found: MediaItem[] = [];
    for (const message of messages) {
      for (const attachment of message.attachments ?? []) {
        found.push({ ...attachment, messageId: message.id ?? "" });
      }
    }
    return found;
  }, [messages]);

  const visible = filter === "all" ? items : items.filter((item) => item.kind === filter);
  const images = visible.filter((item) => item.kind === "image");
  const docs = visible.filter((item) => item.kind !== "image");

  if (missing) {
    return (
      <>
        <Link className="back" href="/student/tutors">
          ← My tutors
        </Link>
        <section className="card" style={{ marginTop: 12 }}>
          <h1>That tutor is not on the desk</h1>
        </section>
      </>
    );
  }

  if (!tutor) return <p className="meta">Opening media.</p>;

  return (
    <>
      <header className="tutor-head">
        <Link className="back" href={`/student/tutor/${tutor.id}`} aria-label="Back to chat">
          ←
        </Link>
        <Link className="th-ava" href={`/student/tutor/${tutor.id}/profile`} aria-label="Tutor profile">
          <Mascot color={tutor.mascotColor} />
        </Link>
        <div className="th-id">
          <h2>{tutor.name}</h2>
          <p className="meta">
            <Link href={`/student/tutor/${tutor.id}/profile`}>View profile</Link>
          </p>
        </div>
      </header>
      <section className="card media-sheet">
        <div className="row">
          <h2>Media</h2>
          <Link className="btn btn-ghost btn-sm" href={`/student/tutor/${tutor.id}?search=1`}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-4-4" />
            </svg>
            Search
          </Link>
        </div>
        <div className="seg" role="tablist" aria-label="Media type">
          {FILTERS.map((item) => (
            <button key={item.id} type="button" className={filter === item.id ? "on" : undefined} onClick={() => setFilter(item.id)}>
              {item.label}
            </button>
          ))}
        </div>
        {note ? <p className="meta">{note}</p> : null}
        {visible.length === 0 ? <p>No links, PDFs, or images in this chat yet.</p> : null}
        {images.length > 0 ? (
          <>
            <h3 className="meta">Images · {images.length}</h3>
            <div className="media-grid">
              {images.map((item) => (
                <a key={`${item.messageId}-${item.url}`} className="media-img" href={item.messageId ? `/student/tutor/${tutor.id}#msg-${item.messageId}` : item.url}>
                  <img src={item.url} alt="" />
                  <span>{item.title}</span>
                </a>
              ))}
            </div>
          </>
        ) : null}
        {docs.length > 0 ? (
          <>
            <h3 className="meta" style={{ marginTop: images.length > 0 ? 14 : 0 }}>
              Links and PDFs · {docs.length}
            </h3>
            <div className="list">
              {docs.map((item) => (
                <a
                  key={`${item.messageId}-${item.url}`}
                  className="media-row"
                  href={item.messageId ? `/student/tutor/${tutor.id}#msg-${item.messageId}` : item.url}
                >
                  <span className="mtag">{item.kind === "pdf" ? "PDF" : "Link"}</span>
                  <span>
                    <b>{item.title}</b>
                  </span>
                </a>
              ))}
            </div>
          </>
        ) : null}
        <Link className="btn btn-ghost btn-block" style={{ marginTop: 14 }} href={`/student/tutor/${tutor.id}`}>
          Close
        </Link>
      </section>
    </>
  );
}
