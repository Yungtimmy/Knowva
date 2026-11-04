"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ResourceCards, resourceKey } from "@/components/student/ResourceCards";
import { getJson, postJson } from "@/lib/api-client";
import { readStore, writeStore } from "@/lib/browser-store";
import type { ResourceBundle, ResourceItem, ResourcePreference, StudyPack } from "@/lib/types";

const PREFS: { id: ResourcePreference; label: string }[] = [
  { id: "mixed", label: "All" },
  { id: "video", label: "Video" },
  { id: "pdf", label: "Notes" },
];

const SAVED_KEY = "knowva.savedLinks.v1";

export default function LearnPage() {
  const [tab, setTab] = useState<"discover" | "saved">("discover");
  const [query, setQuery] = useState("");
  const [preference, setPreference] = useState<ResourcePreference>("mixed");
  const [bundle, setBundle] = useState<ResourceBundle | null>(null);
  const [packs, setPacks] = useState<StudyPack[]>([]);
  const [savedLinks, setSavedLinks] = useState<ResourceItem[]>([]);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (window.location.hash === "#saved") setTab("saved");
    setSavedLinks(readStore<ResourceItem[]>(SAVED_KEY, []));
    getJson<{ materials: StudyPack[] }>("/api/materials")
      .then((data) => setPacks(data.materials))
      .catch(() => undefined);
  }, []);

  const savedKeys = new Set(savedLinks.map((item) => resourceKey(item)));
  const items = bundle ? [...bundle.primary, ...bundle.alternates] : [];

  async function discover(nextPreference: ResourcePreference, nextQuery: string) {
    const topic = nextQuery.trim();
    if (topic.length < 2) {
      setNote("Type a topic to search.");
      return;
    }
    setBusy(true);
    setNote("");
    try {
      const data = await postJson<{ resources: ResourceBundle; note?: string }>("/api/resources", {
        subject: topic,
        topic,
        preference: nextPreference,
        level: "intermediate",
      });
      setBundle(data.resources);
      const count = data.resources.primary.length + data.resources.alternates.length;
      if (count === 0) setNote(data.note || "No checked links for that topic yet.");
    } catch (error) {
      setBundle(null);
      setNote(error instanceof Error ? error.message : "Could not load resources.");
    } finally {
      setBusy(false);
    }
  }

  function toggleSave(item: ResourceItem) {
    setSavedLinks((current) => {
      const key = resourceKey(item);
      const next = current.some((entry) => resourceKey(entry) === key)
        ? current.filter((entry) => resourceKey(entry) !== key)
        : [item, ...current].slice(0, 20);
      writeStore(SAVED_KEY, next);
      return next;
    });
  }

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
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void discover(preference, query);
          }}
        >
          <input
            value={query}
            placeholder="Type a topic, e.g. Linear Algebra"
            aria-label="Topic"
            style={{ marginBottom: 6 }}
            onChange={(event) => setQuery(event.target.value)}
          />
          <p className="meta" style={{ margin: "0 0 12px" }}>
            Knowva picks checked courses and videos for your topic.
          </p>
          <div className="chips" style={{ marginBottom: 14 }}>
            {PREFS.map((item) => (
              <button
                key={item.id}
                className={preference === item.id ? "chip on" : "chip"}
                type="button"
                onClick={() => {
                  setPreference(item.id);
                  if (query.trim().length >= 2) void discover(item.id, query);
                }}
              >
                {item.label}
              </button>
            ))}
          </div>
          <button className="btn btn-primary" type="submit" disabled={busy}>
            {busy ? "Finding" : "Find resources"}
          </button>
          <div style={{ marginTop: 16 }}>
            <ResourceCards items={items} savedKeys={savedKeys} onSave={toggleSave} />
          </div>
        </form>
      ) : (
        <>
          <article className="card">
            <div className="row">
              <span className="type">Study pack</span>
            </div>
            <h3 style={{ margin: "8px 0 2px" }}>Turn notes into a study pack</h3>
            <p className="meta">Paste notes or a text PDF. You get a summary, flashcards and questions.</p>
            <Link className="btn btn-primary" href="/student/materials" style={{ marginTop: 12 }}>
              Make study pack
            </Link>
          </article>
          {packs.length === 0 && savedLinks.length === 0 ? <p className="meta">No saved packs yet.</p> : null}
          {packs.map((pack) => (
            <article className="card" key={pack.id}>
              <div className="row">
                <span className="type">Study pack</span>
                <span className="meta">{pack.subject}</span>
              </div>
              <h3 style={{ margin: "8px 0 2px" }}>{pack.topic}</h3>
              <p className="meta">
                {pack.summary.length} summary lines, {pack.flashcards.length} flashcards, {pack.questions.length} practice questions
              </p>
              <Link className="tc-link" href={`/student/materials/${pack.id}`}>
                Open pack
              </Link>
            </article>
          ))}
          <ResourceCards items={savedLinks} savedKeys={savedKeys} onSave={toggleSave} />
        </>
      )}
      {note ? (
        <p className="meta" role="alert">
          {note}
        </p>
      ) : null}
    </>
  );
}
