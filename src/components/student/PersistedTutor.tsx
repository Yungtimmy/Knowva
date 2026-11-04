"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getJson } from "@/lib/api-client";
import type { Tutor, TutorCard, TutorMessage } from "@/lib/types";
import { TutorDesk } from "./TutorDesk";

export function PersistedTutor({ tutorId, openSearch = false }: { tutorId: string; openSearch?: boolean }) {
  const [tutor, setTutor] = useState<Tutor | null>(null);
  const [messages, setMessages] = useState<TutorMessage[]>([]);
  const [historyError, setHistoryError] = useState("");
  const [missing, setMissing] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancel = false;
    setReady(false);
    setMissing(false);
    Promise.allSettled([
      getJson<{ tutor: Tutor }>(`/api/tutors/${tutorId}`),
      getJson<{ messages: TutorMessage[] }>(`/api/tutors/${tutorId}/messages`),
    ]).then(([tutorResult, messageResult]) => {
      if (cancel) return;
      if (tutorResult.status === "rejected") {
        setMissing(true);
        setReady(true);
        return;
      }
      setTutor(tutorResult.value.tutor);
      if (messageResult.status === "fulfilled") {
        setMessages(messageResult.value.messages);
        setHistoryError("");
      } else {
        setMessages([]);
        const reason = messageResult.reason;
        setHistoryError(reason instanceof Error ? reason.message : "Could not load this chat.");
      }
      setReady(true);
    });
    return () => {
      cancel = true;
    };
  }, [tutorId]);

  if (missing) {
    return (
      <>
        <Link className="back" href="/student/tutors">
          ← My tutors
        </Link>
        <section className="card" style={{ marginTop: 12 }}>
          <h1>That tutor is not on the desk</h1>
          <p>Create a tutor and it will keep its own course.</p>
          <Link className="btn btn-primary" href="/student/tutors/new" style={{ marginTop: 12 }}>
            Create a tutor
          </Link>
        </section>
      </>
    );
  }

  if (!ready || !tutor) return <p className="meta">Opening the tutor.</p>;

  const card: TutorCard = {
    id: tutor.id,
    name: tutor.name,
    subject: tutor.course,
    level: tutor.level,
    topic: tutor.focus,
    status: "ready",
    preview: tutor.focus,
    updatedAt: "",
    mascotColor: tutor.mascotColor,
  };
  return (
    <TutorDesk
      key={tutor.id}
      tutor={card}
      persistedId={tutor.id}
      mascotColor={tutor.mascotColor}
      openSearch={openSearch}
      initialMessages={messages}
      historyError={historyError}
    />
  );
}
