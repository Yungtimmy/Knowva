"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getJson } from "@/lib/api-client";
import type { Tutor, TutorCard } from "@/lib/types";
import { TutorDesk } from "./TutorDesk";

export function PersistedTutor({ tutorId }: { tutorId: string }) {
  const [tutor, setTutor] = useState<Tutor | null>(null);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    getJson<{ tutor: Tutor }>(`/api/tutors/${tutorId}`)
      .then((data) => setTutor(data.tutor))
      .catch(() => setMissing(true));
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

  if (!tutor) return <p className="meta">Opening the tutor.</p>;

  const card: TutorCard = {
    id: tutor.id,
    name: tutor.name,
    subject: tutor.course,
    level: tutor.level,
    topic: tutor.focus,
    status: "ready",
    preview: tutor.focus,
    updatedAt: "",
  };
  return <TutorDesk tutor={card} persistedId={tutor.id} />;
}
