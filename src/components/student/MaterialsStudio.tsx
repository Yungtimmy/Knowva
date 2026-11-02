"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { postJson } from "@/lib/api-client";
import { readStore, writeStore } from "@/lib/browser-store";
import { cellPack } from "@/lib/demo";
import type { StudyPack } from "@/lib/types";
import { PackView } from "./PackView";

const STARTER_NOTES =
  "The cell is the basic unit of life. Plant cells have a cell wall, chloroplasts and a large vacuole. Animal cells do not. The nucleus controls the cell. Mitochondria release energy through respiration...";

type Response = { demo?: boolean; pack: StudyPack };

const SUBJECTS = ["Biology", "Mathematics", "Physics", "English"];

export function MaterialsStudio({
  initialSubject,
  initialTopic,
}: {
  initialSubject?: string;
  initialTopic?: string;
}) {
  const custom = Boolean(initialSubject || initialTopic);
  const [subject, setSubject] = useState(initialSubject || cellPack.subject);
  const [topic, setTopic] = useState(initialTopic || cellPack.topic);
  const [notes, setNotes] = useState(custom ? "" : STARTER_NOTES);
  const [pack, setPack] = useState<StudyPack | null>(custom ? null : cellPack);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");
  const [pdfNote, setPdfNote] = useState("");
  const [pdfBase64, setPdfBase64] = useState<string | null>(null);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setNote("");
    try {
      const data = await postJson<Response>("/api/materials/generate", {
        subject,
        topic,
        notes,
        pdfBase64: pdfBase64 ?? undefined,
      });
      setPack(data.pack);
      const stored = readStore<Record<string, StudyPack>>("knowva.packs", {});
      stored[data.pack.id] = data.pack;
      writeStore("knowva.packs", stored);
      setNote(data.demo ? "Demo pack. No model key is set, so this draft stays on your notes." : "Study pack ready.");
    } catch (caught) {
      setNote(caught instanceof Error ? caught.message : "Could not make a pack.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Link className="back" href="/student">
        ← Home
      </Link>
      <section className="row" style={{ margin: "12px 0 14px" }}>
        <div>
          <h1>Turn notes into a study pack</h1>
          <p>Paste your notes or add a text PDF. You get a summary, flashcards and questions.</p>
        </div>
        <svg width="64" height="52" viewBox="0 0 110 90" aria-hidden="true">
          <path d="M20 70C2 70 0 48 14 42 8 24 30 14 40 24 46 6 72 8 74 24 92 18 106 34 96 48 110 58 98 78 82 72 74 86 50 84 46 74 36 82 22 80 20 70Z" fill="#FBE062" />
          <ellipse cx="46" cy="40" rx="7" ry="10" fill="#fff" />
          <ellipse cx="62" cy="40" rx="7" ry="10" fill="#fff" />
          <circle cx="49" cy="42" r="4" />
          <circle cx="65" cy="42" r="4" />
        </svg>
      </section>
      <form className="card" onSubmit={onSubmit}>
        <label>Subject and topic</label>
        <div className="fields" style={{ marginBottom: 10 }}>
          <input
            value={subject}
            list="pack-subjects"
            aria-label="Subject"
            onChange={(event) => setSubject(event.target.value)}
          />
          <input value={topic} onChange={(event) => setTopic(event.target.value)} aria-label="Topic" />
        </div>
        <datalist id="pack-subjects">
          {SUBJECTS.map((item) => (
            <option key={item} value={item} />
          ))}
        </datalist>
        <label htmlFor="notes">Your notes</label>
        <textarea id="notes" rows={5} value={notes} onChange={(event) => setNotes(event.target.value)} />
        <div className="row" style={{ marginTop: 12 }}>
          <label className="btn btn-ghost" style={{ margin: 0, fontSize: 14, padding: "10px 16px" }}>
            Add PDF
            <input
              type="file"
              accept="application/pdf"
              hidden
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (!file) return;
                if (file.size > 1_500_000) {
                  setPdfBase64(null);
                  setPdfNote("That PDF is too large. Paste the notes.");
                  return;
                }
                const reader = new FileReader();
                reader.onload = () => {
                  const result = typeof reader.result === "string" ? reader.result : "";
                  const base64 = result.split(",")[1] ?? "";
                  setPdfBase64(base64 || null);
                  setPdfNote(base64 ? "Text PDF attached. Scanned pages are refused." : "Could not read that PDF.");
                };
                reader.readAsDataURL(file);
              }}
            />
          </label>
          <span className="meta">Text PDFs, up to 10 pages</span>
        </div>
        {pdfNote ? <p className="meta" style={{ marginTop: 8 }}>{pdfNote}</p> : null}
        <button className="btn btn-primary btn-block" style={{ marginTop: 16 }} type="submit" disabled={busy}>
          {busy ? "Making the pack" : "Make study pack"}
        </button>
        {note ? <p className="meta" style={{ marginTop: 8 }}>{note}</p> : null}
      </form>
      {pack ? (
        <>
          <h2 style={{ marginTop: 22 }}>Your pack</h2>
          <PackView pack={pack} />
        </>
      ) : (
        <p className="meta" style={{ marginTop: 16 }}>
          Your study pack will show up here.
        </p>
      )}
    </>
  );
}
