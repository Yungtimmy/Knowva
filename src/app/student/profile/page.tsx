"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { LoadingMascot } from "@/components/LoadingMascot";
import { getJson } from "@/lib/api-client";
import type { PresentedProfile } from "@/lib/profile";
import { shortWhen } from "@/lib/student-format";
import type { ProgressReport } from "@/lib/types";

function detailsLine(profile: PresentedProfile) {
  return [
    profile.username ? `@${profile.username}` : null,
    profile.age === null ? null : `${profile.age} years old`,
  ]
    .filter(Boolean)
    .join(" · ");
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<PresentedProfile | null>(null);
  const [report, setReport] = useState<ProgressReport | null>(null);
  const [note, setNote] = useState("");
  const [photoNote, setPhotoNote] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  async function upload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setUploading(true);
    setPhotoNote("");
    try {
      const body = new FormData();
      body.append("file", file);
      const response = await fetch("/api/profile/avatar", { method: "POST", body });
      const data = (await response.json().catch(() => ({}))) as { avatarUrl?: string; error?: string };
      const avatarUrl = data.avatarUrl;
      if (!response.ok || !avatarUrl) throw new Error(data.error || "Could not upload that photo.");
      setProfile((current) => (current ? { ...current, avatarUrl } : current));
      setPhotoNote("Photo updated.");
    } catch (error) {
      setPhotoNote(error instanceof Error ? error.message : "Could not upload that photo.");
    } finally {
      setUploading(false);
    }
  }

  useEffect(() => {
    let cancel = false;
    Promise.allSettled([
      getJson<{ profile: PresentedProfile }>("/api/profile"),
      getJson<{ progress: ProgressReport }>("/api/progress"),
    ]).then(([profileResult, progressResult]) => {
      if (cancel) return;
      if (profileResult.status === "fulfilled") setProfile(profileResult.value.profile);
      if (progressResult.status === "fulfilled") setReport(progressResult.value.progress);
      if (profileResult.status === "rejected") {
        setNote(
          profileResult.reason instanceof Error ? profileResult.reason.message : "Could not load your profile.",
        );
      } else if (progressResult.status === "rejected") {
        setNote(
          progressResult.reason instanceof Error ? progressResult.reason.message : "Could not load your scores.",
        );
      } else {
        setNote("");
      }
    });
    return () => {
      cancel = true;
    };
  }, []);

  if (!profile) return note ? <p className="meta">{note}</p> : <LoadingMascot />;

  const names = report?.topics.map((topic) => topic.topic) ?? [];
  const shared = new Set(names.filter((name, index) => names.indexOf(name) !== index));
  const details = detailsLine(profile);

  return (
    <>
      <h1>Profile</h1>
      <p className="meta" style={{ margin: "4px 0 18px" }}>
        Your details, and what your tests say so far.
      </p>
      <section className="card">
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span className="avatar" style={{ width: 56, height: 56, fontSize: 18, flex: "none", overflow: "hidden" }}>
            {profile.avatarUrl ? <img src={profile.avatarUrl} alt="" /> : profile.initials}
          </span>
          <div style={{ minWidth: 0 }}>
            <b style={{ fontSize: 18 }}>{profile.displayName || profile.greetingName}</b>
            <p className="meta" style={{ margin: "2px 0 0" }}>
              {details || "Student"}
            </p>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginTop: 14 }}>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => fileInput.current?.click()}
            disabled={uploading}
          >
            {uploading ? "Uploading…" : profile.avatarUrl ? "Change photo" : "Upload photo"}
          </button>
          <input
            ref={fileInput}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            hidden
            onChange={(event) => void upload(event)}
          />
          {photoNote ? (
            <span className="meta" role="status">
              {photoNote}
            </span>
          ) : null}
        </div>
        {profile.interests.length > 0 ? (
          <>
            <p className="meta" style={{ margin: "16px 0 6px" }}>
              Learning
            </p>
            <div className="chips">
              {profile.interests.map((interest) => (
                <span key={interest} className="chip">
                  {interest}
                </span>
              ))}
            </div>
          </>
        ) : null}
      </section>
      <h2>Your scores</h2>
      <p className="meta" style={{ margin: "0 0 12px" }}>
        {!report
          ? note || "Your scores are unavailable right now."
          : report.testsTaken === 0
            ? "Take a test and the scores will show up here. One score is a signal, not a measure of ability."
            : `Based on ${report.testsTaken} ${report.testsTaken === 1 ? "test" : "tests"}. One score is a signal, not a measure of ability.`}
      </p>
      {report ? (
        <>
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
      ) : null}
    </>
  );
}
