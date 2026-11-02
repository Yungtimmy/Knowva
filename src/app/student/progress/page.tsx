"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getJson } from "@/lib/api-client";
import { shortWhen } from "@/lib/student-format";
import type { ProgressReport } from "@/lib/types";

export default function ProgressPage() {
  const [report, setReport] = useState<ProgressReport | null>(null);
  const [note, setNote] = useState("Loading progress.");

  useEffect(() => {
    getJson<{ progress: ProgressReport }>("/api/progress")
      .then((data) => {
        setReport(data.progress);
        setNote("");
      })
      .catch((error: unknown) => setNote(error instanceof Error ? error.message : "Could not load progress."));
  }, []);

  if (!report) return <p className="meta">{note}</p>;
  const names = report.topics.map((topic) => topic.topic);
  const shared = new Set(names.filter((name, index) => names.indexOf(name) !== index));

  return (
    <>
      <h1>Progress</h1>
      <p className="meta" style={{ margin: "4px 0 18px" }}>
        {report.testsTaken === 0
          ? "Take a test and the scores will show up here. One score is a signal, not a measure of ability."
          : `Based on ${report.testsTaken} ${report.testsTaken === 1 ? "test" : "tests"}. One score is a signal, not a measure of ability.`}
      </p>
      <div className="two" style={{ marginBottom: 14 }}>
        <div className="card">
          <p className="meta">Average score</p>
          <b className="big">{report.averagePercent === null ? "—" : `${report.averagePercent}%`}</b>
        </div>
        <div className="card">
          <p className="meta">Tests taken</p>
          <b className="big">{report.testsTaken}</b>
        </div>
      </div>
      <h2>Topic performance</h2>
      <section className="card list">
        {report.topics.length === 0 ? <p>Take a test to see topic scores.</p> : null}
        {report.topics.map((topic) => (
          <div key={`${topic.course}-${topic.topic}`}>
            <div className="row">
              <span>{shared.has(topic.topic) ? `${topic.topic} · ${topic.course}` : topic.topic}</span>
              <span className="meta">{topic.percent}%</span>
            </div>
            <div className="bar">
              <i className={topic.percent < 60 ? "warn" : undefined} style={{ width: `${topic.percent}%` }} />
            </div>
          </div>
        ))}
      </section>
      <h2>Areas to improve</h2>
      <section className="card list">
        {report.weakTopics.length === 0 ? <p>No topic is under 60% yet.</p> : null}
        {report.weakTopics.map((topic) => (
          <Link
            className="row lnk"
            key={`${topic.course}-${topic.topic}`}
            href={topic.tutorId ? `/student/tutor/${topic.tutorId}` : "/student/tutors"}
          >
            <span>
              <b>
                {topic.topic} · {topic.percent}%
              </b>
              <br />
              <span className="meta">{topic.tutorName ? `Practise with ${topic.tutorName}` : topic.course}</span>
            </span>
            <span>→</span>
          </Link>
        ))}
      </section>
      <h2>Test history</h2>
      <section className="card list">
        {report.history.length === 0 ? <p>No tests yet.</p> : null}
        {report.history.map((test) => (
          <Link className="row lnk" key={test.id} href={`/student/tests/${test.id}/results`}>
            <span>
              <b>{test.course}</b>
              <br />
              <span className="meta">{shortWhen(test.submittedAt ?? test.createdAt)}</span>
            </span>
            <b>
              {test.score}/{test.total}
            </b>
          </Link>
        ))}
      </section>
    </>
  );
}
