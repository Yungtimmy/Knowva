"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ResourceCards } from "@/components/student/ResourceCards";
import { getJson } from "@/lib/api-client";
import { OPTION_LETTERS, questionTag, shortWhen } from "@/lib/student-format";
import type { GradedItem, TestResult } from "@/lib/types";

function choiceLine(item: GradedItem, index: number) {
  const tag = questionTag(item.questionId, index);
  if (item.correct) return `${tag} · Correct`;
  if (item.selectedIndex === null || item.selectedIndex < 0) return `${tag} · Incorrect · left blank`;
  const letter = OPTION_LETTERS[item.selectedIndex];
  return letter ? `${tag} · Incorrect · you chose ${letter}` : `${tag} · Incorrect`;
}

export default function TestResultsPage() {
  const params = useParams<{ id: string }>();
  const [result, setResult] = useState<TestResult | null>(null);
  const [note, setNote] = useState("Loading results.");

  useEffect(() => {
    getJson<{ result: TestResult }>(`/api/tests/${params.id}/results`)
      .then((data) => {
        setResult(data.result);
        setNote("");
      })
      .catch((error: unknown) => setNote(error instanceof Error ? error.message : "Results are not ready."));
  }, [params.id]);

  if (!result) return <p className="meta">{note}</p>;
  const ordered = result.items
    .map((item, index) => ({ item, index }))
    .sort((a, b) => Number(a.item.correct) - Number(b.item.correct));
  const resources = result.resources ? [...result.resources.primary, ...result.resources.alternates] : [];

  return (
    <>
      <p className="meta">
        {result.course} · {shortWhen(result.submittedAt)}
      </p>
      <h1>
        You scored {result.score}/{result.total}
      </h1>
      <div className="two" style={{ margin: "16px 0" }}>
        <div className="card">
          <p className="meta">Correct</p>
          <b className="big">{result.correct}</b>
        </div>
        <div className="card">
          <p className="meta">Incorrect</p>
          <b className="big">{result.incorrect}</b>
        </div>
      </div>
      <h2>Weak topics</h2>
      <section className="card list">
        {result.weakTopics.length === 0 ? <p>No topic was under 60%. One score is a signal, not a measure of ability.</p> : null}
        {result.weakTopics.map((topic) => (
          <div key={topic.topic}>
            <div className="row">
              <b>{topic.topic}</b>
              <span className="meta">
                {topic.correct}/{topic.total}
              </span>
            </div>
            <div className="bar">
              <i className="warn" style={{ width: `${topic.percent}%` }} />
            </div>
          </div>
        ))}
      </section>
      <h2>Explanations</h2>
      <section className="card list">
        {ordered.map(({ item, index }) => (
          <div key={item.questionId}>
            <p className="meta">{choiceLine(item, index)}</p>
            <p>{item.explanation}</p>
          </div>
        ))}
      </section>
      <h2>Next steps</h2>
      <section className="card list">
        {result.recommendations.map((item) => (
          <Link className="row lnk" href={item.href} key={item.title}>
            <span>
              <b>{item.title}</b>
              <br />
              <span className="meta">{item.detail}</span>
            </span>
            <span>→</span>
          </Link>
        ))}
      </section>
      {resources.length > 0 ? (
        <>
          <h2>Resources</h2>
          <ResourceCards items={resources} />
        </>
      ) : null}
    </>
  );
}
