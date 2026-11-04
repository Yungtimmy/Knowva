"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { getJson, postJson } from "@/lib/api-client";
import { shortWhen, topicSeeds, topicsMatch } from "@/lib/student-format";
import type { TestDifficulty, TestPaper, TestSummary, Tutor } from "@/lib/types";

const COUNTS = [5, 10, 20];
const LEVELS: { id: TestDifficulty; label: string }[] = [
  { id: "easy", label: "Easy" },
  { id: "medium", label: "Medium" },
  { id: "hard", label: "Hard" },
];

function TestCentre() {
  const router = useRouter();
  const params = useSearchParams();
  const presetCourse = params.get("course") ?? "";
  const presetTutor = params.get("tutor") ?? "";
  const presetTopic = params.get("topic") ?? "";
  const presetCount = Number(params.get("count"));
  const [choice, setChoice] = useState("custom");
  const [custom, setCustom] = useState("");
  const [tutors, setTutors] = useState<Tutor[]>([]);
  const [picked, setPicked] = useState<string[]>([]);
  const [added, setAdded] = useState<string[]>([]);
  const [draftTopic, setDraftTopic] = useState("");
  const [questionCount, setQuestionCount] = useState(COUNTS.includes(presetCount) ? presetCount : 10);
  const [difficulty, setDifficulty] = useState<TestDifficulty>("medium");
  const [recent, setRecent] = useState<TestSummary[]>([]);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancel = false;
    Promise.allSettled([
      getJson<{ tutors: Tutor[] }>("/api/tutors"),
      getJson<{ tests: TestSummary[] }>("/api/tests"),
    ]).then(([tutorResult, testResult]) => {
      if (cancel) return;
      const list = tutorResult.status === "fulfilled" ? tutorResult.value.tutors : [];
      setTutors(list);
      if (testResult.status === "fulfilled") setRecent(testResult.value.tests);
      const match =
        (presetTutor ? list.find((tutor) => tutor.id === presetTutor) : undefined) ??
        (presetCourse ? list.find((tutor) => tutor.course === presetCourse) : undefined);
      if (match) {
        setChoice(match.course);
        const seeds = topicSeeds(match.focus);
        const hit = presetTopic ? seeds.find((seed) => topicsMatch(seed, presetTopic)) : undefined;
        if (hit) setPicked([hit]);
        else if (presetTopic) {
          setPicked([presetTopic]);
          setAdded([presetTopic]);
        } else setPicked(seeds);
      } else if (presetCourse) {
        setChoice("custom");
        setCustom(presetCourse);
        if (presetTopic) {
          setPicked([presetTopic]);
          setAdded([presetTopic]);
        }
      } else if (list[0]) {
        setChoice(list[0].course);
        setPicked(topicSeeds(list[0].focus));
      }
    });
    return () => {
      cancel = true;
    };
  }, [presetCourse, presetTopic, presetTutor]);

  const course = choice === "custom" ? custom.trim() : choice;
  const focus = tutors.find((tutor) => tutor.course === course)?.focus ?? "";
  const chips = [...new Set([...topicSeeds(focus), ...added])];
  const open = recent.find((test) => test.status === "open");

  function onCourse(value: string) {
    setChoice(value);
    setAdded([]);
    if (value === "custom") {
      setPicked([]);
      return;
    }
    const tutor = tutors.find((item) => item.course === value);
    setPicked(topicSeeds(tutor?.focus ?? ""));
  }

  function toggle(topic: string) {
    setPicked((current) => (current.includes(topic) ? current.filter((item) => item !== topic) : [...current, topic]));
  }

  function commitTopic() {
    const topic = draftTopic.trim();
    if (topic.length < 2 || chips.includes(topic)) {
      setDraftTopic("");
      return;
    }
    setAdded((current) => [...current, topic]);
    setPicked((current) => [...current, topic]);
    setDraftTopic("");
  }

  async function start(event: React.FormEvent) {
    event.preventDefault();
    if (!course || open) return;
    setBusy(true);
    setNote("");
    const matched = tutors.find((tutor) => tutor.course === course);
    try {
      const data = await postJson<{ test: TestPaper }>("/api/tests", {
        course,
        questionCount,
        difficulty,
        topics: picked.length > 0 ? picked : undefined,
        format: "multiple_choice",
        tutorId: matched?.id,
      });
      router.push(`/student/tests/${data.test.id}`);
    } catch (error) {
      setNote(error instanceof Error ? error.message : "Could not start the test.");
      setBusy(false);
      getJson<{ tests: TestSummary[] }>("/api/tests")
        .then((data) => setRecent(data.tests))
        .catch(() => undefined);
    }
  }

  return (
    <>
      <h1>Test Centre</h1>
      <p className="meta" style={{ margin: "4px 0 18px" }}>
        Formal tests, scored and saved to Progress. For quick practice, ask your tutor for a quiz.
      </p>
      {open ? (
        <p className="note">
          You have an open test. <Link href={`/student/tests/${open.id}`}>Continue it</Link> before starting another. Tutor chat stays locked until you submit.
        </p>
      ) : null}
      <form className="card" onSubmit={start}>
        <div className="field">
          <label htmlFor="co">Course</label>
          <select id="co" value={choice} onChange={(event) => onCourse(event.target.value)}>
            {tutors.map((tutor) => (
              <option key={tutor.id} value={tutor.course}>
                {tutor.course}
              </option>
            ))}
            <option value="custom">{tutors.length > 0 ? "Another course" : "Type a course"}</option>
          </select>
          {choice === "custom" ? (
            <input
              style={{ marginTop: 8 }}
              value={custom}
              placeholder="CSC 301 · Prompt engineering"
              aria-label="Course name"
              onChange={(event) => setCustom(event.target.value)}
              required
            />
          ) : null}
        </div>
        <div className="field">
          <label>Number of questions</label>
          <div className="chips">
            {COUNTS.map((count) => (
              <button
                key={count}
                className={questionCount === count ? "chip on" : "chip"}
                type="button"
                onClick={() => setQuestionCount(count)}
              >
                {count}
              </button>
            ))}
          </div>
        </div>
        <div className="field">
          <label>Difficulty</label>
          <div className="chips">
            {LEVELS.map((item) => (
              <button
                key={item.id}
                className={difficulty === item.id ? "chip on" : "chip"}
                type="button"
                onClick={() => setDifficulty(item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
        <div className="field">
          <label>Topics</label>
          <div className="chips">
            {chips.map((topic) => (
              <button
                key={topic}
                className={picked.includes(topic) ? "chip on" : "chip"}
                type="button"
                aria-pressed={picked.includes(topic)}
                onClick={() => toggle(topic)}
              >
                {topic}
              </button>
            ))}
          </div>
          <div className="row" style={{ marginTop: 8 }}>
            <input
              value={draftTopic}
              placeholder="Add a topic"
              aria-label="Add a topic"
              onChange={(event) => setDraftTopic(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  commitTopic();
                }
              }}
            />
            <button className="btn btn-ghost btn-sm" type="button" onClick={commitTopic}>
              Add
            </button>
          </div>
        </div>
        <div className="field">
          <label>Format</label>
          <div className="chips">
            <span className="chip on">Multiple choice</span>
          </div>
        </div>
        <p className="note">Tutor chat is locked during a test. You can review answers with your tutor afterwards.</p>
        <button className="btn btn-primary btn-block" type="submit" disabled={busy || !course || Boolean(open)}>
          {busy ? "Preparing the test" : "Start test"}
        </button>
        {note ? (
          <p className="note" role="alert">
            {note}
          </p>
        ) : null}
      </form>
      <h2>Recent tests</h2>
      <section className="card list">
        {recent.length === 0 ? <p>No tests yet.</p> : null}
        {recent.map((test) => (
          <Link
            className="row lnk"
            key={test.id}
            href={test.status === "submitted" ? `/student/tests/${test.id}/results` : `/student/tests/${test.id}`}
          >
            <span>
              <b>{test.course}</b>
              <br />
              <span className="meta">
                {test.status === "open" ? "Open" : shortWhen(test.submittedAt ?? test.createdAt)} · {test.questionCount} questions
              </span>
            </span>
            <b>{test.score === null || test.total === null ? "Open" : `${test.score}/${test.total}`}</b>
          </Link>
        ))}
      </section>
    </>
  );
}

export default function TestCentrePage() {
  return (
    <Suspense fallback={<p className="meta">Opening Test Centre.</p>}>
      <TestCentre />
    </Suspense>
  );
}
