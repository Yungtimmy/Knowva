"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getJson, postJson } from "@/lib/api-client";
import type { TestDifficulty, TestPaper, TestSummary } from "@/lib/types";

const COUNTS = [5, 10, 20];
const LEVELS: TestDifficulty[] = ["easy", "medium", "hard"];

export default function TestCentrePage() {
  const router = useRouter();
  const [course, setCourse] = useState("");
  const [topics, setTopics] = useState("");
  const [questionCount, setQuestionCount] = useState(10);
  const [difficulty, setDifficulty] = useState<TestDifficulty>("medium");
  const [recent, setRecent] = useState<TestSummary[]>([]);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  function load() {
    getJson<{ tests: TestSummary[] }>("/api/tests")
      .then((data) => setRecent(data.tests))
      .catch(() => undefined);
  }

  useEffect(() => {
    load();
  }, []);

  async function start(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setNote("");
    try {
      const data = await postJson<{ test: TestPaper }>("/api/tests", {
        course,
        questionCount,
        difficulty,
        topics: topics
          .split(",")
          .map((topic) => topic.trim())
          .filter(Boolean),
        format: "multiple_choice",
      });
      router.push(`/student/tests/${data.test.id}`);
    } catch (error) {
      setNote(error instanceof Error ? error.message : "Could not start the test.");
      setBusy(false);
      load();
    }
  }

  return (
    <>
      <h1>Test Centre</h1>
      <p className="meta" style={{ margin: "4px 0 18px" }}>
        Formal tests, scored and saved to Progress. For quick practice, ask your tutor for a quiz.
      </p>
      <form className="card" onSubmit={start}>
        <div className="field">
          <label htmlFor="co">Course</label>
          <input id="co" value={course} onChange={(event) => setCourse(event.target.value)} required />
        </div>
        <div className="field">
          <label>Number of questions</label>
          <div className="chips">
            {COUNTS.map((count) => (
              <button key={count} className={questionCount === count ? "chip on" : "chip"} type="button" onClick={() => setQuestionCount(count)}>
                {count}
              </button>
            ))}
          </div>
        </div>
        <div className="field">
          <label>Difficulty</label>
          <div className="chips">
            {LEVELS.map((item) => (
              <button key={item} className={difficulty === item ? "chip on" : "chip"} type="button" onClick={() => setDifficulty(item)}>
                {item[0]?.toUpperCase()}
                {item.slice(1)}
              </button>
            ))}
          </div>
        </div>
        <div className="field">
          <label htmlFor="topics">Topics</label>
          <input id="topics" value={topics} placeholder="Comma-separated, optional" onChange={(event) => setTopics(event.target.value)} />
        </div>
        <p className="note">Tutor chat is locked during a test. You can review answers with your tutor afterwards.</p>
        <button className="btn btn-primary btn-block" type="submit" disabled={busy}>
          {busy ? "Preparing the test" : "Start test"}
        </button>
        {note ? <p className="meta" style={{ marginTop: 8 }}>{note}</p> : null}
      </form>
      <h2>Recent tests</h2>
      <section className="card list">
        {recent.length === 0 ? <p>No tests yet.</p> : null}
        {recent.map((test) => (
          <Link
            className="row lnk"
            key={test.id}
            href={test.status === "submitted" ? `/student/tests/${test.id}/results` : `/student/tests/${test.id}`}
          >
            <span>
              <b>{test.course}</b>
              <br />
              <span className="meta">
                {test.questionCount} questions · {test.status}
              </span>
            </span>
            <b>{test.score === null ? "Open" : `${test.score}/${test.total}`}</b>
          </Link>
        ))}
      </section>
    </>
  );
}
