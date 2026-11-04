"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { Mascot } from "@/components/Mascot";
import { getJson, sendJson } from "@/lib/api-client";
import { mascotColorName } from "@/lib/mascot-color";
import { clip, levelLabel } from "@/lib/student-format";
import type { ExplanationStyle, LearningGoal, LearningLevel, Tutor } from "@/lib/types";

const LEVELS: { id: LearningLevel; label: string }[] = [
  { id: "beginner", label: "Beginner" },
  { id: "intermediate", label: "Intermediate" },
  { id: "advanced", label: "Advanced" },
];

const STYLES: { id: ExplanationStyle; label: string }[] = [
  { id: "step_by_step", label: "Step by step" },
  { id: "example_first", label: "Example first" },
  { id: "concise", label: "Concise" },
];

const GOALS: { id: LearningGoal; label: string }[] = [
  { id: "pass_exam", label: "Pass an exam" },
  { id: "understand_basics", label: "Understand basics" },
  { id: "practise_problems", label: "Practise problems" },
  { id: "revise_fast", label: "Revise fast" },
];

export function TutorProfile({ tutorId }: { tutorId: string }) {
  const router = useRouter();
  const [tutor, setTutor] = useState<Tutor | null>(null);
  const [missing, setMissing] = useState(false);
  const [name, setName] = useState("");
  const [course, setCourse] = useState("");
  const [focus, setFocus] = useState("");
  const [level, setLevel] = useState<LearningLevel>("intermediate");
  const [explanationStyle, setExplanationStyle] = useState<ExplanationStyle>("step_by_step");
  const [goals, setGoals] = useState<LearningGoal[]>(["understand_basics"]);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    getJson<{ tutor: Tutor }>(`/api/tutors/${tutorId}`)
      .then((data) => {
        setTutor(data.tutor);
        setName(data.tutor.name);
        setCourse(data.tutor.course);
        setFocus(data.tutor.focus);
        setLevel(data.tutor.level);
        setExplanationStyle(data.tutor.explanationStyle);
        setGoals(data.tutor.goals);
      })
      .catch(() => setMissing(true));
  }, [tutorId]);

  function toggleGoal(goal: LearningGoal) {
    setGoals((current) => {
      if (current.includes(goal)) return current.filter((item) => item !== goal);
      if (current.length >= 4) return current;
      return [...current, goal];
    });
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setNote("");
    try {
      const data = await sendJson<{ tutor: Tutor }>(`/api/tutors/${tutorId}`, "PATCH", {
        name,
        course,
        focus,
        level,
        explanationStyle,
        goals,
      });
      setTutor(data.tutor);
      setNote("Saved.");
    } catch (error) {
      setNote(error instanceof Error ? error.message : "Could not save the tutor.");
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    setBusy(true);
    setNote("");
    try {
      await sendJson(`/api/tutors/${tutorId}`, "DELETE");
      router.push("/student/tutors");
    } catch (error) {
      setNote(error instanceof Error ? error.message : "Could not delete that tutor.");
      setBusy(false);
    }
  }

  if (missing) {
    return (
      <>
        <Link className="back" href="/student/tutors">
          ← My tutors
        </Link>
        <section className="card" style={{ marginTop: 12 }}>
          <h1>That tutor is not on the desk</h1>
          <Link className="btn btn-primary" href="/student/tutors/new" style={{ marginTop: 12 }}>
            Create a tutor
          </Link>
        </section>
      </>
    );
  }

  if (!tutor) return <p className="meta">Opening the tutor profile.</p>;

  return (
    <>
      <Link className="back" href="/student/tutors">
        ← My tutors
      </Link>
      <section className="card" style={{ textAlign: "center", marginTop: 12 }}>
        <div className="tc-face" style={{ margin: "0 auto 10px", width: 84, height: 84, background: "#F7F4EC" }}>
          <Mascot color={tutor.mascotColor} className="profile-mascot" />
        </div>
        <h1>{tutor.name}</h1>
        <p className="meta">
          {levelLabel(tutor.level)} · {tutor.course} · {clip(tutor.focus, 48)}
        </p>
        <p className="meta">Mascot colour: {mascotColorName(tutor.mascotColor)}</p>
      </section>
      <form className="card" onSubmit={onSubmit}>
        <h2 style={{ marginBottom: 10 }}>Tutor settings</h2>
        <div className="field">
          <label htmlFor="tutor-name">Name</label>
          <input id="tutor-name" value={name} maxLength={80} onChange={(event) => setName(event.target.value)} required />
        </div>
        <div className="two">
          <div>
            <label htmlFor="tutor-level">Level</label>
            <select id="tutor-level" value={level} onChange={(event) => setLevel(event.target.value as LearningLevel)}>
              {LEVELS.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="tutor-subject">Subject</label>
            <input id="tutor-subject" value={course} maxLength={120} onChange={(event) => setCourse(event.target.value)} required />
          </div>
        </div>
        <label htmlFor="tutor-topic" style={{ marginTop: 10 }}>
          Topic or course title
        </label>
        <input id="tutor-topic" value={focus} maxLength={500} onChange={(event) => setFocus(event.target.value)} required />
        <div className="field" style={{ marginTop: 12 }}>
          <label>Explanation style</label>
          <div className="chips">
            {STYLES.map((item) => (
              <button
                key={item.id}
                className={explanationStyle === item.id ? "chip on" : "chip"}
                type="button"
                onClick={() => setExplanationStyle(item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
        <div className="field">
          <label>Learning goals</label>
          <div className="chips">
            {GOALS.map((item) => (
              <button
                key={item.id}
                className={goals.includes(item.id) ? "chip on" : "chip"}
                type="button"
                aria-pressed={goals.includes(item.id)}
                onClick={() => toggleGoal(item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
        <button className="btn btn-primary btn-block" style={{ marginTop: 14 }} type="submit" disabled={busy}>
          {busy ? "Saving changes" : "Save changes"}
        </button>
        {note ? (
          <p className="meta" role="status" style={{ marginTop: 8 }}>
            {note}
          </p>
        ) : null}
      </form>
      <section className="card">
        <Link className="btn btn-ghost btn-block" href={`/student/tutor/${tutor.id}`}>
          Open chat
        </Link>
        <Link className="btn btn-ghost btn-block" style={{ marginTop: 10 }} href={`/student/tutor/${tutor.id}/media`}>
          Media from this chat
        </Link>
        <button className="danger-link" type="button" onClick={() => void remove()} disabled={busy}>
          {confirmDelete ? "Confirm delete" : "Delete tutor"}
        </button>
      </section>
    </>
  );
}
