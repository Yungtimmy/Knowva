"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import styles from "@/app/student/quiz/quiz.module.css";
import { postJson } from "@/lib/api-client";
import { readStore } from "@/lib/browser-store";
import { photosynthesisReviewAnswers } from "@/lib/demo";
import type { Attempt, Question, Recommendation } from "@/lib/types";

type Quiz = { id: string; subject: string; topic: string; questions: Question[] };
type ScoreResponse = { demo?: boolean; attempt: Attempt; recommendation: Recommendation };

function tutorHref(subject: string) {
  const text = subject.toLowerCase();
  if (text.includes("bio")) return "/student/tutor/biology";
  if (text.includes("math")) return "/student/tutor/maths";
  if (text.includes("physic")) return "/student/tutor/physics";
  if (text.includes("english")) return "/student/tutor/english";
  return "/student/tutors";
}

export function QuizPlayer({
  quizId,
  fallback,
  startOnReview,
}: {
  quizId: string;
  fallback: Quiz | null;
  startOnReview: boolean;
}) {
  const [quiz, setQuiz] = useState<Quiz | null>(fallback);
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [missed, setMissed] = useState<number[]>([]);
  const [picked, setPicked] = useState<number | null>(null);
  const [done, setDone] = useState(false);
  const [recommendation, setRecommendation] = useState<Recommendation | null>(null);
  const [note, setNote] = useState("");
  const answers = useRef<number[]>([]);

  useEffect(() => {
    const stored = readStore<Record<string, Quiz>>("knowva.quizzes", {});
    const current = stored[quizId] ?? fallback;
    if (stored[quizId]) setQuiz(stored[quizId]);
    const review = startOnReview || window.location.hash === "#review";
    if (!review || !current || quizId !== "photosynthesis") return;
    const wrong = photosynthesisReviewAnswers.flatMap((answer, item) =>
      answer === current.questions[item]?.answerIndex ? [] : [item],
    );
    setScore(photosynthesisReviewAnswers.length - wrong.length);
    setMissed(wrong);
    setDone(true);
    void postJson<{ recommendation: Recommendation }>("/api/recommend", {
      subject: current.subject,
      topic: current.topic,
      score: photosynthesisReviewAnswers.length - wrong.length,
      total: current.questions.length,
      tutorHref: "/student/tutor/biology",
      quizHref: "/student/quiz/photosynthesis",
    })
      .then((data) => setRecommendation(data.recommendation))
      .catch(() => setRecommendation(null));
  }, [quizId, startOnReview, fallback]);

  async function finish(current: Quiz) {
    setDone(true);
    try {
      const data = await postJson<ScoreResponse>("/api/quiz/score", {
        quizId: current.id,
        subject: current.subject,
        topic: current.topic,
        questions: current.questions,
        answers: current.questions.map((_, item) => answers.current[item] ?? 0),
      });
      setScore(data.attempt.score);
      setMissed(data.attempt.missed);
      setRecommendation(data.recommendation);
      setNote(data.demo ? "Scored on this device. Demo mode does not call a model." : "Score saved.");
    } catch (caught) {
      setNote(caught instanceof Error ? caught.message : "Could not save the score.");
    }
  }

  if (!quiz) {
    return (
      <>
        <Link className="back" href="/student">
          ← Home
        </Link>
        <section className="card" style={{ marginTop: 12 }}>
          <h1>Quiz not found</h1>
          <p>Open a study pack and take it as a quiz, or use a sample set.</p>
        </section>
      </>
    );
  }

  const currentQuiz = quiz;
  const question = currentQuiz.questions[index];
  const progress = done ? 100 : ((index + 1) / currentQuiz.questions.length) * 100;

  function choose(option: number) {
    if (!question || picked !== null || done) return;
    answers.current[index] = option;
    const correct = option === question.answerIndex;
    setPicked(option);
    if (correct) setScore((value) => value + 1);
    else setMissed((value) => [...value, index]);
  }

  function next() {
    if (index < currentQuiz.questions.length - 1) {
      setIndex(index + 1);
      setPicked(null);
      return;
    }
    void finish(currentQuiz);
  }

  function retry() {
    answers.current = [];
    setIndex(0);
    setScore(0);
    setMissed([]);
    setPicked(null);
    setDone(false);
    setRecommendation(null);
    setNote("");
  }

  return (
    <>
      <Link className="back" href="/student">
        ← Home
      </Link>
      <section style={{ margin: "12px 0" }}>
        <p className="meta">
          {currentQuiz.subject} · {currentQuiz.topic}
        </p>
        <div className="row">
          <h1>{done ? "Done" : `Question ${index + 1} of ${currentQuiz.questions.length}`}</h1>
          <span className="chip">Score {score}</span>
        </div>
        <div className="bar" style={{ marginTop: 10 }}>
          <i style={{ width: `${progress}%`, background: "var(--kn-orange)" }} />
        </div>
      </section>
      {!done && question ? (
        <section className="card">
          <h2>{question.prompt}</h2>
          {question.options.map((option, optionIndex) => {
            const className = [
              styles.opt,
              picked !== null && optionIndex === question.answerIndex ? styles.right : "",
              picked !== null && optionIndex === picked && optionIndex !== question.answerIndex ? styles.wrong : "",
            ]
              .filter(Boolean)
              .join(" ");
            return (
              <button key={option} type="button" className={className} disabled={picked !== null} onClick={() => choose(optionIndex)}>
                {option}
              </button>
            );
          })}
          {picked !== null ? (
            <div>
              <p className={styles.why}>
                <b>{picked === question.answerIndex ? "Correct." : "Not quite."}</b> {question.explanation}
              </p>
              <button className="btn btn-primary btn-block" style={{ marginTop: 14 }} type="button" onClick={next}>
                {index < quiz.questions.length - 1 ? "Next question" : "See results"}
              </button>
            </div>
          ) : null}
        </section>
      ) : (
        <section className="card">
          <h2>
            You scored {score} of {currentQuiz.questions.length}
          </h2>
          <p className="meta">Saved to {currentQuiz.topic} on your dashboard</p>
          {missed.length === 0 ? (
            <p style={{ marginTop: 10 }}>Every answer right. Try a harder set next.</p>
          ) : (
            <>
              <h3 style={{ marginTop: 14 }}>Review what you missed</h3>
              {missed.map((item) => {
                const missedQuestion = currentQuiz.questions[item];
                if (!missedQuestion) return null;
                return (
                  <div key={missedQuestion.id} className={styles.why}>
                    <b>{missedQuestion.prompt}</b>
                    <br />
                    Answer: {missedQuestion.options[missedQuestion.answerIndex]}. {missedQuestion.explanation}
                  </div>
                );
              })}
            </>
          )}
          {recommendation ? (
            <p style={{ marginTop: 14 }}>
              <b>{recommendation.title}.</b> {recommendation.detail}
            </p>
          ) : null}
          {note ? <p className="meta">{note}</p> : null}
          <div className="two" style={{ marginTop: 16 }}>
            <Link className="btn btn-ghost" href={tutorHref(currentQuiz.subject)}>
              Ask tutor
            </Link>
            <button className="btn btn-primary" type="button" onClick={retry}>
              Try again
            </button>
          </div>
        </section>
      )}
    </>
  );
}
