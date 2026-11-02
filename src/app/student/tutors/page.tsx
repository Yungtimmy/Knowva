"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getJson, sendJson } from "@/lib/api-client";
import { TUTOR_CAP, type Tutor } from "@/lib/types";

const FACES = ["#2412B0", "#FF4A1C", "#FBE062", "#1C1B19"];

export default function TutorsPage() {
  const [tutors, setTutors] = useState<Tutor[]>([]);
  const [note, setNote] = useState("Loading tutors.");

  function load() {
    getJson<{ tutors: Tutor[]; remaining: number }>("/api/tutors")
      .then((data) => {
        setTutors(data.tutors);
        setNote(`${data.tutors.length} of ${TUTOR_CAP} tutors.`);
      })
      .catch((error: unknown) => setNote(error instanceof Error ? error.message : "Could not load tutors."));
  }

  useEffect(() => {
    load();
  }, []);

  async function remove(id: string) {
    setNote("Deleting.");
    try {
      await sendJson(`/api/tutors/${id}`, "DELETE");
      load();
    } catch (error) {
      setNote(error instanceof Error ? error.message : "Could not delete that tutor.");
    }
  }

  return (
    <>
      <div className="row" style={{ marginBottom: 16 }}>
        <div>
          <h1>My tutors</h1>
          <p className="meta">{note}</p>
        </div>
        <Link className="btn btn-primary btn-sm" href="/student/tutors/new">
          Create a tutor
        </Link>
      </div>
      <section className="card list">
        {tutors.length === 0 ? <p>No saved tutors yet. Create one for a course.</p> : null}
        {tutors.map((tutor, index) => (
          <article className="trow" key={tutor.id}>
            <Link className="trow-main" href={`/student/tutor/${tutor.id}`}>
              <span className="face" style={{ background: FACES[index % FACES.length] }} />
              <span>
                <h3>{tutor.name}</h3>
                <span className="meta">
                  {tutor.course} · {tutor.level}
                </span>
              </span>
            </Link>
            <span className="trow-act">
              <Link href={`/student/tutors/new?id=${tutor.id}`}>Edit</Link>
              <button type="button" onClick={() => remove(tutor.id)}>
                Delete
              </button>
            </span>
          </article>
        ))}
      </section>
      <Link className="add-tutor" href="/student/tutors/new">
        + Create a tutor
      </Link>
    </>
  );
}
