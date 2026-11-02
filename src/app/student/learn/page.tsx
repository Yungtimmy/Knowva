"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ResourceCards, resourceKey } from "@/components/student/ResourceCards";
import { getJson, postJson } from "@/lib/api-client";
import { readStore, writeStore } from "@/lib/browser-store";
import type { ResourceBundle, ResourceItem, ResourcePreference, StudyPack, Tutor } from "@/lib/types";

const PREFS: { id: ResourcePreference; label: string }[] = [
  { id: "mixed", label: "All" },
  { id: "video", label: "Video" },
  { id: "pdf", label: "Notes" },
  { id: "course", label: "Link" },
];

const SAVED_KEY = "knowva.savedLinks.v1";

export default function LearnPage() {
  const [tab, setTab] = useState<"discover" | "saved">("discover");
  const [query, setQuery] = useState("");
  const [tutorId, setTutorId] = useState("");
  const [tutors, setTutors] = useState<Tutor[]>([]);
  const [preference, setPreference] = useState<ResourcePreference>("mixed");
  const [bundle, setBundle] = useState<ResourceBundle | null>(null);
  const [packs, setPacks] = useState<StudyPack[]>([]);
  const [savedLinks, setSavedLinks] = useState<ResourceItem[]>([]);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (window.location.hash === "#saved") setTab("saved");
    setSavedLinks(readStore<ResourceItem[]>(SAVED_KEY, []));
    Promise.allSettled([
      getJson<{ tutors: Tutor[] }>("/api/tutors"),
      getJson<{ materials: StudyPack[] }>("/api/materials"),
    ]).then(([tutorResult, packResult]) => {
      if (tutorResult.status === "fulfilled") setTutors(tutorResult.value.tutors);
      if (packResult.status === "fulfilled") setPacks(packResult.value.materials);
    });
  }, []);

  const savedKeys = new Set(savedLinks.map((item) => resourceKey(item)));
  const items = bundle ? [...bundle.primary, ...bundle.alternates] : [];

  async function discover(nextPreference: ResourcePreference, nextQuery: string, nextTutorId: string) {
    const topic = nextQuery.trim();
    const tutor = tutors.find((item) => item.id === nextTutorId);
    const subject = tutor?.course || topic;
    const topicValue = topic || tutor?.focus || subject;
    if (topicValue.trim().length < 2) {
      setNote("Type a topic to search.");
      return;
    }
    setBusy(true);
    setNote("");
    try {
      const data = await postJson<{ resources: ResourceBundle }>("/api/resources", {
        subject,
        topic: topicValue,
        preference: nextPreference,
        level: tutor?.level ?? "intermediate",
      });
      setBundle(data.resources);
    } catch (error) {
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
            void discover(preference, query, tutorId);
          }}
        >
          <input
            value={query}
            placeholder="Search a topic, course or link"
            aria-label="Search a topic, course or link"
            style={{ marginBottom: 12 }}
            onChange={(event) => setQuery(event.target.value)}
          />
          {tutors.length > 0 ? (
            <div className="field">
              <label htmlFor="learn-course">Course</label>
              <select id="learn-course" value={tutorId} onChange={(event) => setTutorId(event.target.value)}>
                <option value="">Use the search text</option>
                {tutors.map((tutor) => (
                  <option key={tutor.id} value={tutor.id}>
                    {tutor.name} · {tutor.course}
                  </option>
                ))}
              </select>
            </div>
          ) : null}
          <div className="chips" style={{ marginBottom: 14 }}>
            {PREFS.map((item) => (
              <button
                key={item.id}
                className={preference === item.id ? "chip on" : "chip"}
                type="button"
                onClick={() => {
                  setPreference(item.id);
                  if (query.trim().length >= 2 || tutorId) void discover(item.id, query, tutorId);
                }}
              >
                {item.label}
              </button>
            ))}
          </div>
          <button className="btn btn-primary" type="submit" disabled={busy}>
            {busy ? "Finding" : "Find resources"}
          </button>
          <p className="meta" style={{ marginTop: 12 }}>
            A checked link is one the server could open. Anything else is a search, not a link.
          </p>
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
