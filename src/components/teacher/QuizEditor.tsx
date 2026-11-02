"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type CSSProperties } from "react";
import { postJson } from "@/lib/api-client";
import { canAssign } from "@/lib/assign";
import { readStore, writeStore } from "@/lib/browser-store";
import { classes } from "@/lib/demo";
import type { Question, TeacherQuiz } from "@/lib/types";

type Generated = {
  demo?: boolean;
  id: string;
  status: "draft";
  title: string;
  questions: Question[];
  markingGuide: TeacherQuiz["markingGuide"];
  timeMinutes: number;
  totalMarks: number;
  questionCount: number;
  reviewedCount: number;
};

const STORE = "knowva.teacherQuizzes";

export function QuizEditor({
  quizId,
  initial,
  presetTopic = "",
  presetKind = "quiz",
}: {
  quizId?: string;
  initial: TeacherQuiz | null;
  presetTopic?: string;
  presetKind?: "quiz" | "marking_guide";
}) {
  const router = useRouter();
  const [level, setLevel] = useState(initial?.level ?? "SS1");
  const [subject, setSubject] = useState(initial?.subject ?? "Biology");
  const [topic, setTopic] = useState(initial?.topic ?? presetTopic);
  const [mix, setMix] = useState("10 MCQ + 2 theory");
  const [change, setChange] = useState("Make Q3 harder and add one diagram question.");
  const [draft, setDraft] = useState<TeacherQuiz | null>(initial);
  const [tab, setTab] = useState<"questions" | "marking">(presetKind === "marking_guide" ? "marking" : "questions");
  const [assignClass, setAssignClass] = useState(initial?.classId ?? "ss1a");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");

  useEffect(() => {
    if (window.location.hash === "#marking") setTab("marking");
    const id = quizId ?? initial?.id;
    if (!id) return;
    const stored = readStore<Record<string, TeacherQuiz>>(STORE, {});
    const saved = stored[id];
    if (!saved) return;
    setDraft(saved);
    setLevel(saved.level);
    setSubject(saved.subject);
    setTopic(saved.topic);
  }, [quizId, initial]);

  async function generate() {
    if (topic.trim().length < 2) {
      setNote("Add a topic first.");
      return;
    }
    setBusy(true);
    setNote("");
    try {
      const data = await postJson<Generated>("/api/teacher/generate", {
        kind: tab === "marking" || presetKind === "marking_guide" ? "marking_guide" : "quiz",
        level,
        subject,
        topic,
        classId: assignClass,
        questionMix: mix,
        prompt: change,
      });
      const next: TeacherQuiz = {
        id: data.id,
        title: data.title,
        level,
        subject,
        topic,
        classId: assignClass,
        status: "draft",
        questions: data.questions,
        markingGuide: data.markingGuide,
        assignedClassIds: [],
        questionCount: data.questionCount,
        totalMarks: data.totalMarks,
        timeMinutes: data.timeMinutes,
        reviewedCount: 0,
        updatedAt: "Just now",
      };
      const stored = readStore<Record<string, TeacherQuiz>>(STORE, {});
      stored[next.id] = next;
      writeStore(STORE, stored);
      const quizzes = readStore<Record<string, { id: string; subject: string; topic: string; questions: Question[] }>>("knowva.quizzes", {});
      quizzes[next.id] = { id: next.id, subject, topic, questions: next.questions };
      writeStore("knowva.quizzes", quizzes);
      setDraft(next);
      setNote(data.demo ? "Demo quiz. Status stays Needs review until you mark it." : "Draft ready. Check every answer before you assign it.");
      if (quizId !== next.id) router.push(`/teacher/quiz/${next.id}`);
    } catch (caught) {
      setNote(caught instanceof Error ? caught.message : "Could not draft the quiz.");
    } finally {
      setBusy(false);
    }
  }

  function persist(next: TeacherQuiz, message: string) {
    const stored = readStore<Record<string, TeacherQuiz>>(STORE, {});
    stored[next.id] = next;
    writeStore(STORE, stored);
    setDraft(next);
    setNote(message);
  }

  function assign() {
    if (!draft) return;
    const gate = canAssign(draft.status);
    if (!gate.ok) {
      setNote(gate.error);
      return;
    }
    if (draft.assignedClassIds.includes(assignClass)) {
      setNote("That class already has this quiz.");
      return;
    }
    persist(
      { ...draft, assignedClassIds: [...draft.assignedClassIds, assignClass] },
      `Assigned to ${classes.find((item) => item.id === assignClass)?.name ?? assignClass}.`,
    );
  }

  return (
    <>
      <div className="head">
        <div>
          <p className="meta">Quizzes and marking</p>
          <h1>{draft?.title || topic || "New quiz"}</h1>
        </div>
        <div className="actions">
          <button className="btn btn-ghost" type="button" onClick={() => draft && downloadQuiz(draft)}>
            Export
          </button>
          <button className="btn btn-primary" type="button" disabled={busy} onClick={() => (draft ? persist({ ...draft, level, subject, topic, updatedAt: "Just now" }, "Saved on this device.") : generate())}>
            {draft ? "Save quiz" : busy ? "Drafting" : "Generate quiz"}
          </button>
        </div>
      </div>
      <div className="card">
        <div className="form">
          <div>
            <label htmlFor="level">Class</label>
            <select id="level" value={level} onChange={(event) => setLevel(event.target.value)}>
              <option>SS1</option>
              <option>SS2</option>
              <option>SS3</option>
            </select>
          </div>
          <div>
            <label htmlFor="subject">Subject</label>
            <select id="subject" value={subject} onChange={(event) => setSubject(event.target.value)}>
              <option>Biology</option>
              <option>Mathematics</option>
              <option>Physics</option>
              <option>English</option>
            </select>
          </div>
          <div>
            <label htmlFor="topic">Topic</label>
            <input id="topic" value={topic} onChange={(event) => setTopic(event.target.value)} />
          </div>
          <div>
            <label htmlFor="mix">Questions</label>
            <select id="mix" value={mix} onChange={(event) => setMix(event.target.value)}>
              <option>10 MCQ + 2 theory</option>
              <option>5 MCQ</option>
              <option>Marking guide only</option>
            </select>
          </div>
          <button className="btn btn-ghost" type="button" onClick={generate} disabled={busy}>
            Regenerate
          </button>
        </div>
      </div>
      <div className="review">
        <i />
        <div>
          <b>Review and edit before classroom use.</b> Check every answer key and mark allocation. Students only see the quiz after you save and assign it.
        </div>
      </div>
      {note ? <p className="meta" style={{ marginTop: -8, marginBottom: 12 }}>{note}</p> : null}
      {draft ? (
        <div className="grid">
          <div>
            <div className="tabs">
              <button className={tab === "questions" ? "on" : undefined} type="button" onClick={() => setTab("questions")} style={tabButton(tab === "questions")}>
                Questions and key
              </button>
              <button className={tab === "marking" ? "on" : undefined} type="button" onClick={() => setTab("marking")} style={tabButton(tab === "marking")}>
                Marking guide
              </button>
              <Link href={draft.id === "photosynthesis" ? "/student/quiz/photosynthesis" : `/student/quiz/${draft.id}`}>
                Student view
              </Link>
            </div>
            {tab === "questions"
              ? draft.questions.map((item, index) => (
                  <article key={item.id} className="q">
                    <p className="meta">
                      Q{index + 1} · MCQ · {item.marks ?? 1} mark
                    </p>
                    <p>
                      <b
                        contentEditable
                        suppressContentEditableWarning
                        onBlur={(event) => {
                          const questions = draft.questions.slice();
                          const current = questions[index];
                          if (!current) return;
                          questions[index] = { ...current, prompt: event.currentTarget.textContent ?? current.prompt };
                          setDraft({ ...draft, questions, status: "draft" });
                        }}
                      >
                        {item.prompt}
                      </b>
                    </p>
                    <ol>
                      {item.options.map((option, optionIndex) => (
                        <li key={option} className={optionIndex === item.answerIndex ? "ans" : undefined}>
                          <button
                            type="button"
                            onClick={() => {
                              const questions = draft.questions.slice();
                              const current = questions[index];
                              if (!current) return;
                              questions[index] = { ...current, answerIndex: optionIndex };
                              setDraft({ ...draft, questions, status: "draft" });
                            }}
                            style={{ all: "unset", cursor: "pointer" }}
                          >
                            {option}
                          </button>
                        </li>
                      ))}
                    </ol>
                    <div className="mk">Explanation shown to students: {item.explanation}</div>
                  </article>
                ))
              : null}
            <h2 id="marking" style={{ marginTop: 22 }}>
              Marking guide · theory
            </h2>
            {draft.markingGuide.map((item) => (
              <article key={item.questionId} className="q">
                <p className="meta">
                  {item.questionId} · Theory · {item.points.reduce((sum, point) => sum + point.marks, 0)} marks
                </p>
                <p>
                  <b>{item.prompt}</b>
                </p>
                <table style={{ marginTop: 8 }}>
                  <tbody>
                    <tr>
                      <th>Point to award</th>
                      <th>Marks</th>
                    </tr>
                    {item.points.map((point) => (
                      <tr key={point.text}>
                        <td>{point.text}</td>
                        <td>{point.marks}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="mk">{item.notes}</div>
              </article>
            ))}
          </div>
          <div>
            <div className="card">
              <h2>Quiz details</h2>
              <table>
                <tbody>
                  <tr>
                    <td>Questions</td>
                    <td style={{ textAlign: "right" }}>
                      <b>{draft.questionCount}</b>
                    </td>
                  </tr>
                  <tr>
                    <td>Total marks</td>
                    <td style={{ textAlign: "right" }}>
                      <b>{draft.totalMarks}</b>
                    </td>
                  </tr>
                  <tr>
                    <td>Time</td>
                    <td style={{ textAlign: "right" }}>
                      <b>{draft.timeMinutes} min</b>
                    </td>
                  </tr>
                  <tr>
                    <td>Reviewed</td>
                    <td style={{ textAlign: "right" }}>
                      <b>
                        {draft.reviewedCount} of {draft.questionCount}
                      </b>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="card">
              <h2>Assign to students</h2>
              <label htmlFor="assign">Class</label>
              <select id="assign" value={assignClass} onChange={(event) => setAssignClass(event.target.value)}>
                {classes.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
              <p className="meta" style={{ margin: "10px 0" }}>
                Students take it one question at a time and see the explanation after each answer.
                {draft.status !== "reviewed" ? " Mark it reviewed before you assign it." : ""}
              </p>
              <div className="actions">
                <Link className="btn btn-ghost btn-sm" href={draft.id === "photosynthesis" ? "/student/quiz/photosynthesis" : `/student/quiz/${draft.id}`}>
                  Preview as student
                </Link>
                <button className="btn btn-ghost btn-sm" type="button" onClick={assign} disabled={!canAssign(draft.status).ok}>
                  Assign to class
                </button>
              </div>
              {draft.assignedClassIds.length > 0 ? (
                <p className="meta" style={{ marginTop: 8 }}>
                  Assigned: {draft.assignedClassIds.join(", ")}
                </p>
              ) : null}
            </div>
            <div className="card">
              <h2>Adjust the draft</h2>
              <textarea rows={3} value={change} onChange={(event) => setChange(event.target.value)} aria-label="Ask for a change" />
              <button className="btn btn-ghost btn-sm" type="button" style={{ marginTop: 10 }} onClick={generate} disabled={busy}>
                Apply change
              </button>
            </div>
            <div className="card">
              <p className="meta">Status</p>
              <p>
                <span className={draft.status === "reviewed" ? "tag ok" : "tag draft"}>
                  {draft.status === "reviewed" ? "Reviewed" : "Needs review"}
                </span>
              </p>
              {draft.status === "draft" ? (
                <button className="btn btn-ghost btn-sm" type="button" style={{ marginTop: 10 }} onClick={() => persist({ ...draft, status: "reviewed", reviewedCount: draft.questionCount }, "Marked as reviewed. You can assign it now.")}>
                  Mark as reviewed
                </button>
              ) : null}
            </div>
          </div>
        </div>
      ) : (
        <p className="meta">Generate a quiz, check the key, then mark it reviewed before you assign it.</p>
      )}
    </>
  );
}

function tabButton(on: boolean): CSSProperties {
  return {
    padding: "6px 14px",
    borderRadius: 99,
    fontSize: 13,
    fontWeight: 500,
    color: on ? "var(--kn-cream)" : "var(--kn-ink-2)",
    border: "1px solid var(--kn-line)",
    background: on ? "var(--kn-ink)" : "var(--kn-surface)",
    cursor: "pointer",
  };
}

function downloadQuiz(quiz: TeacherQuiz) {
  const lines = quiz.questions.map((item, index) => {
    const choices = item.options.map((option, optionIndex) => `${String.fromCharCode(65 + optionIndex)}. ${option}`).join("\n");
    return `Q${index + 1}. ${item.prompt}\n${choices}\nAnswer: ${item.options[item.answerIndex]}\n${item.explanation}`;
  });
  const blob = new Blob([[quiz.title, "", ...lines].join("\n\n")], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${quiz.title}.txt`;
  anchor.click();
  URL.revokeObjectURL(url);
}
