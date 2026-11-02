"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getJson, postJson } from "@/lib/api-client";
import { withLetter } from "@/lib/student-format";
import type { TestPaper, TestResult } from "@/lib/types";

export default function TestTakePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [paper, setPaper] = useState<TestPaper | null>(null);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    getJson<{ test: TestPaper }>(`/api/tests/${params.id}`)
      .then((data) => {
        if (data.test.status === "submitted") {
          router.replace(`/student/tests/${params.id}/results`);
          return;
        }
        setPaper(data.test);
        setAnswers(Array(data.test.questions.length).fill(-1));
      })
      .catch((error: unknown) => setNote(error instanceof Error ? error.message : "Could not open the test."));
  }, [params.id, router]);

  async function finish() {
    if (!paper || busy) return;
    setBusy(true);
    try {
      await postJson<{ result: TestResult }>(`/api/tests/${paper.id}/submit`, { answers });
      router.push(`/student/tests/${paper.id}/results`);
    } catch (error) {
      setNote(error instanceof Error ? error.message : "Could not submit the test.");
      setBusy(false);
    }
  }

  if (!paper) return <p className="meta">{note || "Opening the test."}</p>;
  const question = paper.questions[index];
  if (!question) return <p className="meta">This test has no questions.</p>;
  const picked = answers[index] ?? -1;
  const blanks = answers.some((value) => value < 0);

  return (
    <>
      <div className="row">
        <b>
          Question {index + 1} of {paper.questions.length}
        </b>
        <span className="meta">{question.topic}</span>
      </div>
      <div className="bar" style={{ margin: "8px 0 18px" }} aria-hidden="true">
        <i style={{ width: `${((index + 1) / paper.questions.length) * 100}%` }} />
      </div>
      <section className="card">
        <h2>{question.prompt}</h2>
        <div className="opts">
          {question.options.map((option, optionIndex) => (
            <label className={picked === optionIndex ? "opt on" : "opt"} key={`${question.id}-${optionIndex}`}>
              <input
                type="radio"
                name={`q-${index}`}
                checked={picked === optionIndex}
                onChange={() => setAnswers((current) => current.map((value, item) => (item === index ? optionIndex : value)))}
              />
              {withLetter(option, optionIndex)}
            </label>
          ))}
        </div>
      </section>
      <div className="row">
        <button className="btn btn-ghost" type="button" disabled={index === 0} onClick={() => setIndex((value) => value - 1)}>
          Previous
        </button>
        {index < paper.questions.length - 1 ? (
          <button className="btn btn-primary" type="button" onClick={() => setIndex((value) => value + 1)}>
            Next question
          </button>
        ) : (
          <button className="btn btn-primary" type="button" disabled={busy} onClick={() => void finish()}>
            {busy ? "Scoring" : "Submit test"}
          </button>
        )}
      </div>
      {blanks ? (
        <p className="meta" style={{ textAlign: "center", marginTop: 12 }}>
          Unanswered questions are left blank.
        </p>
      ) : null}
      <p className="meta" style={{ textAlign: "center", marginTop: 18 }}>
        Leaving now ends the test.{" "}
        <button
          type="button"
          onClick={() => void finish()}
          disabled={busy}
          style={{ background: "none", border: 0, color: "var(--kn-ink)", font: "inherit", textDecoration: "underline", cursor: "pointer" }}
        >
          Submit test
        </button>
      </p>
      {note ? (
        <p className="meta" role="alert">
          {note}
        </p>
      ) : null}
    </>
  );
}
