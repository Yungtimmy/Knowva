"use client";

import { useEffect, useState } from "react";
import { getJson, postJson } from "@/lib/api-client";
import type { ResourceBundle, ResourcePreference, StudyPack } from "@/lib/types";

const PREFS: { id: ResourcePreference; label: string }[] = [
  { id: "mixed", label: "All" },
  { id: "video", label: "Video" },
  { id: "pdf", label: "PDF" },
  { id: "course", label: "Course" },
];

export default function LearnPage() {
  const [tab, setTab] = useState<"discover" | "saved">("discover");
  const [subject, setSubject] = useState("STA 201 · Probability");
  const [topic, setTopic] = useState("Bayes' theorem");
  const [preference, setPreference] = useState<ResourcePreference>("video");
  const [bundle, setBundle] = useState<ResourceBundle | null>(null);
  const [notes, setNotes] = useState("");
  const [saved, setSaved] = useState<StudyPack[]>([]);
  const [pack, setPack] = useState<StudyPack | null>(null);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    getJson<{ materials: StudyPack[] }>("/api/materials")
      .then((data) => setSaved(data.materials))
      .catch(() => undefined);
  }, [pack]);

  async function discover(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setNote("");
    try {
      const data = await postJson<{ resources: ResourceBundle }>("/api/resources", {
        subject,
        topic,
        preference,
        level: "intermediate",
      });
      setBundle(data.resources);
    } catch (error) {
      setNote(error instanceof Error ? error.message : "Could not load resources.");
    } finally {
      setBusy(false);
    }
  }

  async function generate(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setNote("");
    try {
      const data = await postJson<{ pack: StudyPack }>("/api/materials/generate", { subject, topic, notes });
      setPack(data.pack);
      setTab("saved");
      setNote("Study pack saved to this session.");
    } catch (error) {
      setNote(error instanceof Error ? error.message : "Could not make a pack.");
    } finally {
      setBusy(false);
    }
  }

  const items = bundle ? [...bundle.primary, ...bundle.alternates] : [];

  return (
    <>
      <h1>Learn</h1>
      <div className="seg" role="tablist">
        <button className={tab === "discover" ? "on" : undefined} type="button" onClick={() => setTab("discover")}>
          Discover
        </button>
        <button className={tab === "saved" ? "on" : undefined} type="button" onClick={() => setTab("saved")}>
          Saved
        </button>
      </div>
      {tab === "discover" ? (
        <form onSubmit={discover}>
          <div className="two" style={{ marginBottom: 12 }}>
            <input value={subject} onChange={(event) => setSubject(event.target.value)} aria-label="Course" />
            <input value={topic} onChange={(event) => setTopic(event.target.value)} aria-label="Topic" />
          </div>
          <div className="chips" style={{ marginBottom: 14 }}>
            {PREFS.map((item) => (
              <button key={item.id} className={preference === item.id ? "chip on" : "chip"} type="button" onClick={() => setPreference(item.id)}>
                {item.label}
              </button>
            ))}
          </div>
          <button className="btn btn-primary" type="submit" disabled={busy}>
            {busy ? "Looking" : "Find resources"}
          </button>
          <div style={{ marginTop: 16 }}>
            {items.map((item) => (
              <article className="card" key={`${item.role}-${item.title}`}>
                <span className="type">{item.type}</span>{" "}
                {item.verified ? <span className="ok">Checked link</span> : <span className="meta">Not a checked link</span>}
                <h3 style={{ marginTop: 8 }}>{item.title}</h3>
                <p>{item.why}</p>
                <p className="meta">{item.source}</p>
                {item.verified && item.url ? (
                  <a href={item.url}>Open</a>
                ) : (
                  <p className="meta">Search: {item.searchQuery}</p>
                )}
              </article>
            ))}
          </div>
        </form>
      ) : (
        <form onSubmit={generate}>
          <label htmlFor="notes">Paste notes</label>
          <textarea id="notes" rows={5} value={notes} onChange={(event) => setNotes(event.target.value)} />
          <button className="btn btn-primary" style={{ marginTop: 12 }} type="submit" disabled={busy}>
            {busy ? "Making the pack" : "Make study pack"}
          </button>
          <section className="card list" style={{ marginTop: 16 }}>
            {saved.length === 0 ? <p>No saved packs yet.</p> : null}
            {saved.map((item) => (
              <div key={item.id}>
                <b>{item.topic}</b>
                <p className="meta">
                  {item.subject} · {(item.outline ?? item.summary).length} outline points · {item.questions.length} questions
                </p>
              </div>
            ))}
          </section>
          {pack?.outline ? (
            <section className="card">
              <h2>Outline</h2>
              <ul>
                {pack.outline.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </section>
          ) : null}
        </form>
      )}
      {note ? <p className="meta">{note}</p> : null}
    </>
  );
}
