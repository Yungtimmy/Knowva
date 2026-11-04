"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { getJson, postJson } from "@/lib/api-client";
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
  const [atCap, setAtCap] = useState(false);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!editId) return;
    router.replace(`/student/tutor/${editId}/profile`);
  }, [editId, router]);

  useEffect(() => {
    if (editId) return;
    getJson<{ remaining: number }>("/api/tutors")
      .then((data) => setAtCap(data.remaining <= 0))
      .catch(() => undefined);
  }, [editId]);

  function toggleGoal(goal: LearningGoal) {
    setGoals((current) => {
      if (current.includes(goal)) return current.filter((item) => item !== goal);
      if (current.length >= 4) return current;
      return [...current, goal];
    });
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (atCap) return;
    setBusy(true);
    setNote("");
    const body = { name, course, focus, level, explanationStyle, goals };
    try {
      const data = await postJson<{ tutor: Tutor }>("/api/tutors", body);
      router.push(`/student/tutor/${data.tutor.id}`);
    } catch (error) {
      setNote(error instanceof Error ? error.message : "Could not save the tutor.");
      setBusy(false);
    }
  }

  if (editId) return <p className="meta">Opening the tutor profile.</p>;

  return (
    <>
      <h1>Create a tutor</h1>
      <p className="meta" style={{ margin: "4px 0 18px" }}>
        Tell us what you want to learn. You can change this later.
      </p>
      {atCap && !editId ? (
        <p className="note">You already have 8 tutors. Delete one to add another.</p>
      ) : null}
      <form className="card" onSubmit={onSubmit}>
        <div className="field">
          <label htmlFor="n">Tutor name</label>
          <input
            id="n"
            value={name}
            maxLength={80}
            placeholder="Prompt Coach"
            onChange={(event) => setName(event.target.value)}
            required
          />
        </div>
        <div className="field">
          <label htmlFor="c">Course or subject</label>
          <input
            id="c"
            value={course}
            maxLength={120}
            placeholder="CSC 301 · Prompt engineering"
            onChange={(event) => setCourse(event.target.value)}
            required
          />
        </div>
        <div className="field">
          <label htmlFor="w">What do you want to learn?</label>
          <textarea
            id="w"
            rows={3}
            maxLength={500}
            placeholder="System prompts and few-shot examples before my lab demo."
            value={focus}
            onChange={(event) => setFocus(event.target.value)}
            required
          />
        </div>
        <div className="field">
          <label>Learning level</label>
          <div className="chips">
            {LEVELS.map((item) => (
              <button
                key={item.id}
                className={level === item.id ? "chip on" : "chip"}
                type="button"
                onClick={() => setLevel(item.id)}
              >
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
        <details className="more">
          <summary>More options later</summary>
          <p className="meta">
            Uploading your own notes and PDFs is coming in a later version. Saving a tutor stores a config. It does not train a model.
          </p>
        </details>
        <button className="btn btn-primary btn-block" style={{ marginTop: 8 }} type="submit" disabled={busy || (atCap && !editId)}>
          {busy ? "Saving the tutor" : editId ? "Save tutor" : "Create tutor"}
        </button>
        {note ? (
          <p className="meta" role="alert" style={{ marginTop: 8 }}>
            {note}
          </p>
        ) : null}
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
