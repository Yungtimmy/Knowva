"use client";

import Link from "next/link";
import { useState } from "react";
import { writeStore, readStore } from "@/lib/browser-store";
import type { StudyPack } from "@/lib/types";

export function PackView({ pack }: { pack: StudyPack }) {
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const card = pack.flashcards[index] ?? pack.flashcards[0];
  const preview = pack.questions[0];

  function takeQuiz() {
    const stored = readStore<Record<string, StudyPack>>("knowva.packs", {});
    stored[pack.id] = pack;
    writeStore("knowva.packs", stored);
    const quizzes = readStore<Record<string, { id: string; subject: string; topic: string; questions: StudyPack["questions"] }>>("knowva.quizzes", {});
    quizzes[pack.id] = { id: pack.id, subject: pack.subject, topic: pack.topic, questions: pack.questions };
    writeStore("knowva.quizzes", quizzes);
  }

  return (
    <>
      <section className="card">
        <h3>Summary</h3>
        <ul style={{ paddingLeft: 18, marginTop: 6 }}>
          {pack.summary.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </section>
      <section className="card">
        <div className="row">
          <h3>Flashcards</h3>
          <span className="meta">
            {pack.flashcards.length === 0 ? "0" : index + 1} of {pack.flashcards.length}
          </span>
        </div>
        <button
          id="fc"
          type="button"
          className="bubble"
          style={{
            margin: "12px 0",
            minHeight: 96,
            display: "grid",
            placeItems: "center",
            textAlign: "center",
            cursor: "pointer",
            background: "var(--kn-cream)",
            width: "100%",
            font: "inherit",
            color: "var(--kn-ink)",
          }}
          onClick={() => {
            if (!card) return;
            if (flipped) {
              setFlipped(false);
              setIndex((current) => (current + 1) % pack.flashcards.length);
            } else {
              setFlipped(true);
            }
          }}
        >
          {card ? (flipped ? card.a : card.q) : "No cards yet."}
        </button>
        <p className="meta" style={{ textAlign: "center" }}>
          Tap the card to flip it
        </p>
      </section>
      {preview ? (
        <section className="card">
          <div className="row">
            <h3>Practice questions</h3>
            <span className="meta">{pack.questions.length} questions</span>
          </div>
          <p style={{ margin: "10px 0", color: "var(--kn-ink)" }}>
            1. {preview.prompt}
          </p>
          <div className="chips">
            {preview.options.map((option, optionIndex) => (
              <span key={option} className={optionIndex === preview.answerIndex ? "chip on" : "chip"}>
                {option}
              </span>
            ))}
          </div>
          <Link className="btn btn-ghost btn-block" href={`/student/quiz/${pack.id}`} style={{ marginTop: 14 }} onClick={takeQuiz}>
            Take as a quiz
          </Link>
        </section>
      ) : null}
    </>
  );
}
