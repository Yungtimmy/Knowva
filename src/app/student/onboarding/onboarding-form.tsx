"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { sendJson } from "@/lib/api-client";
import { filterCourses } from "@/lib/courses";

export function OnboardingForm({ suggestedName }: { suggestedName: string }) {
  const router = useRouter();
  const [name, setName] = useState(suggestedName);
  const [username, setUsername] = useState("");
  const [age, setAge] = useState("");
  const [picked, setPicked] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const [note, setNote] = useState("");
  const [interestHint, setInterestHint] = useState(false);
  const [busy, setBusy] = useState(false);
  const visible = useMemo(() => filterCourses(query), [query]);

  function pick(course: string) {
    setPicked((current) => (current.includes(course) ? current : [...current, course]));
    setInterestHint(false);
  }

  function unpick(course: string) {
    setPicked((current) => current.filter((item) => item !== course));
  }

  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (picked.length === 0) {
      setInterestHint(true);
      return;
    }
    const years = Number(age);
    setBusy(true);
    setNote("");
    try {
      await sendJson("/api/profile", "PATCH", {
        displayName: name.trim(),
        username: username.trim().toLowerCase(),
        age: years,
        interests: picked,
      });
      router.refresh();
      router.push("/student");
    } catch (error) {
      setNote(error instanceof Error ? error.message : "Could not save your profile.");
      setBusy(false);
    }
  }

  return (
    <>
      <section className="hello">
        <h1>Tell us about you</h1>
        <p>This takes a minute. Your tutors use it to pitch lessons at the right level.</p>
      </section>
      <form className="card onboard-form" onSubmit={(event) => void save(event)}>
        <label className="field">
          <span>Display name</span>
          <input
            required
            name="name"
            value={name}
            placeholder="What should we call you"
            autoComplete="name"
            maxLength={80}
            onChange={(event) => setName(event.target.value)}
          />
        </label>
        <label className="field">
          <span>Username</span>
          <input
            required
            name="username"
            value={username}
            pattern="[a-z0-9_.]{3,20}"
            placeholder="e.g. tolu_ade"
            autoComplete="username"
            spellCheck={false}
            onChange={(event) => setUsername(event.target.value.toLowerCase())}
          />
          <small className="meta">Shown on your profile. Lowercase letters, numbers, _ or .</small>
        </label>
        <label className="field">
          <span>Age</span>
          <input
            required
            type="number"
            min={10}
            max={99}
            name="age"
            inputMode="numeric"
            value={age}
            onChange={(event) => setAge(event.target.value)}
          />
        </label>
        <div className="field">
          <span>What do you want to learn</span>
          <div className="chips picked" style={{ minHeight: 8 }}>
            {picked.map((course) => (
              <button key={course} className="chip on" type="button" aria-pressed="true" onClick={() => unpick(course)}>
                {course}
              </button>
            ))}
          </div>
          <input
            type="search"
            value={query}
            placeholder="Search courses, e.g. CSC 205, React, Statistics"
            aria-label="Search courses"
            autoComplete="off"
            onChange={(event) => setQuery(event.target.value)}
          />
          <div className="chips course-list">
            {visible.map((course) => {
              const on = picked.includes(course.name);
              return (
                <button
                  key={course.name}
                  className={on ? "chip on" : "chip"}
                  type="button"
                  data-c={course.group}
                  aria-pressed={on}
                  onClick={() => pick(course.name)}
                >
                  {course.name}
                </button>
              );
            })}
          </div>
          {visible.length === 0 ? <p className="meta">No match. Try a course code or a shorter word.</p> : null}
          <small className="meta" style={interestHint ? { color: "#C7360F" } : undefined}>
            Pick at least one.
          </small>
        </div>
        <button className="btn btn-primary btn-block" type="submit" disabled={busy}>
          {busy ? "Saving" : "Save and continue"}
        </button>
        {note ? (
          <p className="note" role="alert">
            {note}
          </p>
        ) : null}
      </form>
    </>
  );
}
