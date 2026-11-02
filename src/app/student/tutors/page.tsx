"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getJson, sendJson } from "@/lib/api-client";
import { cardTime, clip } from "@/lib/student-format";
import { TUTOR_CAP, type Tutor } from "@/lib/types";

const FACES = ["#2412B0", "#FF4A1C", "#FBE062", "#1C1B19"];

export default function TutorsPage() {
  const [tutors, setTutors] = useState<Tutor[]>([]);
  const [ready, setReady] = useState(false);
  const [note, setNote] = useState("");
  const [pending, setPending] = useState<string | null>(null);

  function load() {
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
  }

  useEffect(() => {
    load();
  }, []);

  async function remove(id: string) {
    if (pending !== id) {
      setPending(id);
      return;
    }
    setNote("");
    try {
      await sendJson(`/api/tutors/${id}`, "DELETE");
      setPending(null);
      load();
    } catch (error) {
      setNote(error instanceof Error ? error.message : "Could not delete that tutor.");
    }
  }

  const countLine =
    tutors.length === 0
      ? "No tutors yet. You can keep 8."
      : tutors.length >= TUTOR_CAP
        ? `${TUTOR_CAP} tutors. That is the limit.`
        : `${tutors.length} ${tutors.length === 1 ? "tutor" : "tutors"} · tap one to open it`;

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
        {tutors.map((tutor, index) => (
          <article className="trow" key={tutor.id}>
            <Link className="trow-main" href={`/student/tutor/${tutor.id}`}>
              <span className="face" style={{ background: FACES[index % FACES.length] }} />
              <span>
                <h3>{tutor.name}</h3>
                <span className="meta">
                  {tutor.course}
                  <br />
                  {clip(tutor.focus, 42)} · {cardTime(tutor.updatedAt)}
                </span>
              </span>
            </Link>
            <span className="trow-act">
              <Link href={`/student/tutors/new?id=${tutor.id}`}>Edit</Link>
              <button type="button" onClick={() => void remove(tutor.id)}>
                {pending === tutor.id ? "Confirm delete" : "Delete"}
              </button>
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
