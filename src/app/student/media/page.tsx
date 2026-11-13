"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Mascot } from "@/components/Mascot";
import { getJson } from "@/lib/api-client";
import { clip } from "@/lib/student-format";
import type { Tutor } from "@/lib/types";

export default function MediaPage() {
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
        setNote(error instanceof Error ? error.message : "Could not load media.");
      });
  }, []);

  return (
    <>
      <h1>Media</h1>
      <p className="meta" style={{ margin: "4px 0 18px" }}>
        {ready ? "Links, PDFs, and images saved in each tutor chat." : "Loading media."}
      </p>
      {ready && tutors.length === 0 && !note ? (
        <section className="card">
          <p>No tutors yet. Create one, then attach a file in the chat.</p>
          <Link className="btn btn-primary" href="/student/tutors/new" style={{ marginTop: 14 }}>
            Create a tutor
          </Link>
        </section>
      ) : null}
      {tutors.length > 0 ? (
        <section className="card list">
          {tutors.map((tutor) => (
            <article className="trow" key={tutor.id}>
              <Link className="trow-main" href={`/student/tutor/${tutor.id}/media`}>
                <span className="face">
                  <Mascot color={tutor.mascotColor} className="lib-mascot" />
                </span>
                <span>
                  <h3>{tutor.name}</h3>
                  <span className="meta">{clip(tutor.focus, 42)}</span>
                </span>
              </Link>
            </article>
          ))}
        </section>
      ) : null}
      {note ? (
        <p className="meta" role="alert">
          {note}
        </p>
      ) : null}
    </>
  );
}
