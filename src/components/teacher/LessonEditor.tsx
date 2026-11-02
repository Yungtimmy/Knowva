"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { postJson } from "@/lib/api-client";
import { readStore, writeStore } from "@/lib/browser-store";
import type { LessonDraft, LessonOutline } from "@/lib/types";

type Generated = {
  demo?: boolean;
  id: string;
  status: "draft";
  title: string;
  outline: LessonOutline;
};

const STORE = "knowva.lessons";

export function LessonEditor({
  lessonId,
  initial,
  presetTopic = "",
}: {
  lessonId?: string;
  initial: LessonDraft | null;
  presetTopic?: string;
}) {
  const router = useRouter();
  const [level, setLevel] = useState(initial?.level ?? "SS2");
  const [subject, setSubject] = useState(initial?.subject ?? "Mathematics");
  const [topic, setTopic] = useState(initial?.topic ?? presetTopic);
  const [minutes, setMinutes] = useState(String(initial?.minutes ?? 40));
  const [change, setChange] = useState("Add one real-life example about area of a rectangle.");
  const [draft, setDraft] = useState<LessonDraft | null>(initial);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");

  useEffect(() => {
    if (!lessonId) return;
    const stored = readStore<Record<string, LessonDraft>>(STORE, {});
    const saved = stored[lessonId];
    if (!saved) return;
    setDraft(saved);
    setLevel(saved.level);
    setSubject(saved.subject);
    setTopic(saved.topic);
    setMinutes(String(saved.minutes));
  }, [lessonId]);

  async function generate(kind: "outline" | "notes") {
    if (topic.trim().length < 2) {
      setNote("Add a topic first.");
      return;
    }
    setBusy(true);
    setNote("");
    try {
      const data = await postJson<Generated>("/api/teacher/generate", {
        kind,
        level,
        subject,
        topic,
        classId: "ss2a",
        minutes: Number(minutes) || 40,
        prompt: change,
      });
      const next: LessonDraft = {
        id: data.id,
        title: data.title,
        level,
        subject,
        topic,
        minutes: Number(minutes) || 40,
        classId: "ss2a",
        status: "draft",
        outline: data.outline,
        updatedAt: "Just now",
      };
      const stored = readStore<Record<string, LessonDraft>>(STORE, {});
      stored[next.id] = next;
      writeStore(STORE, stored);
      setDraft(next);
      setNote(data.demo ? "Demo draft. It stays Needs review until you mark it." : "Draft ready. Review it before class.");
      if (lessonId !== next.id) router.push(`/teacher/lesson/${next.id}`);
    } catch (caught) {
      setNote(caught instanceof Error ? caught.message : "Could not draft the lesson.");
    } finally {
      setBusy(false);
    }
  }

  function save(status = draft?.status) {
    if (!draft) return;
    const next = { ...draft, level, subject, topic, minutes: Number(minutes) || draft.minutes, status: status ?? draft.status, updatedAt: "Just now" };
    const stored = readStore<Record<string, LessonDraft>>(STORE, {});
    stored[next.id] = next;
    writeStore(STORE, stored);
    setDraft(next);
    setNote(next.status === "reviewed" ? "Marked as reviewed." : "Saved on this device.");
  }

  function updateOutline(outline: LessonOutline) {
    if (!draft) return;
    setDraft({ ...draft, outline, status: "draft" });
  }

  return (
    <>
      <div className="head">
        <div>
          <p className="meta">Lesson outlines</p>
          <h1>{draft?.title || topic || "New lesson outline"}</h1>
        </div>
        <div className="actions">
          <button className="btn btn-ghost" type="button" onClick={() => window.print()}>
            Export as PDF
          </button>
          <button className="btn btn-primary" type="button" onClick={() => (draft ? save() : generate("outline"))} disabled={busy}>
            {draft ? "Save lesson" : busy ? "Drafting" : "Generate outline"}
          </button>
        </div>
      </div>
      <div className="card">
        <div className="form">
          <div>
            <label htmlFor="class">Class</label>
            <select id="class" defaultValue={level}>
              <option>SS1</option>
              <option>SS2</option>
              <option>SS3</option>
            </select>
          </div>
          <div>
            <label htmlFor="subject">Subject</label>
            <select id="subject" value={subject} onChange={(event) => setSubject(event.target.value)}>
              <option>Mathematics</option>
              <option>Biology</option>
              <option>Physics</option>
              <option>English</option>
            </select>
          </div>
          <div>
            <label htmlFor="topic">Topic</label>
            <input id="topic" value={topic} onChange={(event) => setTopic(event.target.value)} />
          </div>
          <div>
            <label htmlFor="length">Lesson length</label>
            <select id="length" value={minutes} onChange={(event) => setMinutes(event.target.value)}>
              <option value="40">40 minutes</option>
              <option value="80">80 minutes (double)</option>
            </select>
          </div>
          <button className="btn btn-ghost" type="button" onClick={() => generate("outline")} disabled={busy}>
            Regenerate
          </button>
        </div>
      </div>
      <div className="review">
        <i />
        <div>
          <b>Review and edit before classroom use.</b> Knowva drafted this from your topic. Check facts, worked examples and timing against your scheme of work. Click any text to edit it.
        </div>
      </div>
      {note ? <p className="meta" style={{ marginTop: -8, marginBottom: 12 }}>{note}</p> : null}
      {draft ? (
        <div className="grid">
          <div className="card doc">
            <h2>Lesson outline</h2>
            <h3>Objectives</h3>
            <ul>
              {draft.outline.objectives.map((item, index) => (
                <li
                  key={`obj-${index}`}
                  contentEditable
                  suppressContentEditableWarning
                  onBlur={(event) => {
                    const objectives = draft.outline.objectives.slice();
                    objectives[index] = event.currentTarget.textContent ?? item;
                    updateOutline({ ...draft.outline, objectives });
                  }}
                >
                  {item}
                </li>
              ))}
            </ul>
            <h3>Plan</h3>
            <ol>
              {draft.outline.plan.map((step, index) => (
                <li key={`${step.stage}-${index}`}>
                  <b>
                    {step.stage} ({step.minutes} min):
                  </b>{" "}
                  <span
                    contentEditable
                    suppressContentEditableWarning
                    onBlur={(event) => {
                      const plan = draft.outline.plan.slice();
                      const current = plan[index];
                      if (!current) return;
                      plan[index] = { ...current, text: event.currentTarget.textContent ?? current.text };
                      updateOutline({ ...draft.outline, plan });
                    }}
                  >
                    {step.text}
                  </span>
                </li>
              ))}
            </ol>
            <h3>Class notes</h3>
            <div
              contentEditable
              suppressContentEditableWarning
              onBlur={(event) => updateOutline({ ...draft.outline, notes: event.currentTarget.textContent ?? draft.outline.notes })}
            >
              <p>{draft.outline.notes}</p>
            </div>
            <h3>Common mistakes</h3>
            <ul>
              {draft.outline.mistakes.map((item, index) => (
                <li
                  key={`mis-${index}`}
                  contentEditable
                  suppressContentEditableWarning
                  onBlur={(event) => {
                    const mistakes = draft.outline.mistakes.slice();
                    mistakes[index] = event.currentTarget.textContent ?? item;
                    updateOutline({ ...draft.outline, mistakes });
                  }}
                >
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <div className="card">
              <h2>Use this lesson</h2>
              <div className="actions" style={{ flexDirection: "column", alignItems: "stretch" }}>
                <Link className="btn btn-ghost" href={`/teacher/quiz/new?topic=${encodeURIComponent(draft.topic)}&from=${draft.id}`}>
                  Generate quiz from this lesson
                </Link>
                <button
                  className="btn btn-ghost"
                  type="button"
                  onClick={() => {
                    if (draft.status !== "reviewed") {
                      setNote("Mark the lesson as reviewed before sharing it with students.");
                      return;
                    }
                    setNote("Notes marked ready to share. Students still only see work you assign.");
                  }}
                >
                  Share notes with students
                </button>
                <button
                  className="btn btn-ghost"
                  type="button"
                  onClick={() => {
                    const blob = new Blob([draft.outline.notes], { type: "application/msword" });
                    const url = URL.createObjectURL(blob);
                    const anchor = document.createElement("a");
                    anchor.href = url;
                    anchor.download = `${draft.title}.doc`;
                    anchor.click();
                    URL.revokeObjectURL(url);
                  }}
                >
                  Export as Word
                </button>
              </div>
            </div>
            <div className="card">
              <h2>Adjust the draft</h2>
              <label htmlFor="change">Ask for a change</label>
              <textarea id="change" rows={3} value={change} onChange={(event) => setChange(event.target.value)} />
              <button className="btn btn-ghost btn-sm" type="button" style={{ marginTop: 10 }} onClick={() => generate("outline")} disabled={busy}>
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
              <p className="meta" style={{ marginTop: 8 }}>
                Last edited {draft.updatedAt}. {draft.status === "reviewed" ? "Reviewed." : "Saved as draft."}
              </p>
              {draft.status === "draft" ? (
                <button className="btn btn-ghost btn-sm" type="button" style={{ marginTop: 10 }} onClick={() => save("reviewed")}>
                  Mark as reviewed
                </button>
              ) : null}
            </div>
          </div>
        </div>
      ) : (
        <p className="meta">Generate an outline, then edit it before anyone uses it in class.</p>
      )}
    </>
  );
}
