"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Mascot } from "@/components/Mascot";
import { getJson } from "@/lib/api-client";
import { clip, shortWhen } from "@/lib/student-format";
import { TUTOR_CAP, type Tutor } from "@/lib/types";

export default function TutorsPage() {
  const [tutors, setTutors] = useState<Tutor[]>([]);
  const [ready, setReady] = useState(false);
  const [note, setNote] = useState("");

  useEffect(() => {
    getJson<{ tutors: Tutor[] }>("/api/tutors")
      .then((data) => {
        setTutors(data.tutors);
        setNote("");
        setReady(true);
      })
      .catch((error: unknown) => {
        setReady(true);
        setNote(error instanceof Error ? error.message : "Could not load tutors.");
      });
  }, []);

  const countLine =
    tutors.length === 0
      ? "No tutors yet. You can keep 8."
      : tutors.length >= TUTOR_CAP
        ? `${TUTOR_CAP} tutors. That is the limit.`
        : `${tutors.length} ${tutors.length === 1 ? "tutor" : "tutors"} · tap one to pick up your chat`;

  return (
    <>
      <div className="row" style={{ marginBottom: 16 }}>
        <div>
          <h1>My tutors</h1>
          <p className="meta">{ready ? countLine : "Loading tutors."}</p>
        </div>
        <Link className="btn btn-primary btn-sm" href="/student/tutors/new">
          Create a tutor
        </Link>
      </div>
      <section className="card list">
        {ready && tutors.length === 0 ? <p>No saved tutors yet. Create one for a course.</p> : null}
        {tutors.map((tutor) => (
          <article className="trow" key={tutor.id}>
            <Link className="trow-main" href={`/student/tutor/${tutor.id}`}>
              <span className="face">
                <Mascot color={tutor.mascotColor} className="lib-mascot" />
              </span>
              <span>
                <h3>{tutor.name}</h3>
                <span className="meta">
                  {clip(tutor.focus, 42)} · {tutor.lastChatAt ? `Last chat ${chatWhen(tutor.lastChatAt)}` : "No chats yet"}
                </span>
              </span>
            </Link>
            <span className="trow-act">
              <Link href={`/student/tutor/${tutor.id}/profile`}>Profile</Link>
            </span>
          </article>
        ))}
      </section>
      <Link className="add-tutor" href="/student/tutors/new">
        + Create a tutor
      </Link>
      {note ? (
        <p className="meta" role="alert" style={{ marginTop: 12 }}>
          {note}
        </p>
      ) : null}
    </>
  );
}

function chatWhen(iso: string) {
  const label = shortWhen(iso);
  if (label === "Today") return "today";
  if (label === "Yesterday") return "yesterday";
  return label;
}
