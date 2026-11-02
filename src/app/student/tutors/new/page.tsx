"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { getJson, postJson, sendJson } from "@/lib/api-client";
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

function TutorForm() {
  const router = useRouter();
  const params = useSearchParams();
  const editId = params.get("id");
  const [name, setName] = useState("");
  const [course, setCourse] = useState("");
  const [focus, setFocus] = useState("");
  const [level, setLevel] = useState<LearningLevel>("intermediate");
  const [explanationStyle, setExplanationStyle] = useState<ExplanationStyle>("step_by_step");
  const [goals, setGoals] = useState<LearningGoal[]>(["understand_basics"]);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!editId) return;
    getJson<{ tutor: Tutor }>(`/api/tutors/${editId}`)
      .then((data) => {
        setName(data.tutor.name);
        setCourse(data.tutor.course);
        setFocus(data.tutor.focus);
        setLevel(data.tutor.level);
        setExplanationStyle(data.tutor.explanationStyle);
        setGoals(data.tutor.goals);
      })
      .catch((error: unknown) => setNote(error instanceof Error ? error.message : "Could not open that tutor."));
  }, [editId]);

  function toggleGoal(goal: LearningGoal) {
    setGoals((current) => (current.includes(goal) ? current.filter((item) => item !== goal) : [...current, goal]));
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setNote("");
    const body = { name, course, focus, level, explanationStyle, goals };
    try {
      const data = editId
        ? await sendJson<{ tutor: Tutor }>(`/api/tutors/${editId}`, "PATCH", body)
        : await postJson<{ tutor: Tutor }>("/api/tutors", body);
      router.push(`/student/tutor/${data.tutor.id}`);
    } catch (error) {
      setNote(error instanceof Error ? error.message : "Could not save the tutor.");
      setBusy(false);
    }
  }

  return (
    <>
      <Link className="back" href="/student/tutors">
        ← My tutors
      </Link>
      <h1 style={{ marginTop: 12 }}>{editId ? "Edit tutor" : "Create a tutor"}</h1>
      <p className="meta" style={{ margin: "4px 0 18px" }}>
        Tell us what you want to learn. This saves a tutor config. It does not train a model.
      </p>
      <form className="card" onSubmit={onSubmit}>
        <div className="field">
          <label htmlFor="n">Tutor name</label>
          <input id="n" value={name} onChange={(event) => setName(event.target.value)} required />
        </div>
        <div className="field">
          <label htmlFor="c">Course or subject</label>
          <input id="c" value={course} onChange={(event) => setCourse(event.target.value)} required />
        </div>
        <div className="field">
          <label htmlFor="w">What do you want to learn?</label>
          <textarea id="w" rows={3} value={focus} onChange={(event) => setFocus(event.target.value)} required />
        </div>
        <div className="field">
          <label>Learning level</label>
          <div className="chips">
            {LEVELS.map((item) => (
              <button key={item.id} className={level === item.id ? "chip on" : "chip"} type="button" onClick={() => setLevel(item.id)}>
                {item.label}
              </button>
            ))}
          </div>
        </div>
        <div className="field">
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
              <button key={item.id} className={goals.includes(item.id) ? "chip on" : "chip"} type="button" onClick={() => toggleGoal(item.id)}>
                {item.label}
              </button>
            ))}
          </div>
        </div>
        <p className="note">Uploading notes into the tutor is a later version. Preferences cannot override Knowva&apos;s tutoring rules.</p>
        <button className="btn btn-primary btn-block" type="submit" disabled={busy}>
          {busy ? "Saving" : editId ? "Save tutor" : "Create tutor"}
        </button>
        {note ? <p className="meta" style={{ marginTop: 8 }}>{note}</p> : null}
      </form>
    </>
  );
}

export default function NewTutorPage() {
  return (
    <Suspense fallback={<p className="meta">Opening the form.</p>}>
      <TutorForm />
    </Suspense>
  );
}
