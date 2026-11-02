import Link from "next/link";
import { Mascot, mascotFor } from "@/components/Mascot";
import { DEMO_DATE_SHORT, tutorTitle, tutors } from "@/lib/demo";
import type { TutorStatus } from "@/lib/types";

const STATUS_CLASS: Record<TutorStatus, string> = {
  in_lesson: "s-lesson",
  needs_review: "s-review",
  ready: "s-ready",
};

const STATUS_LABEL: Record<TutorStatus, string> = {
  in_lesson: "In a lesson",
  needs_review: "Needs review",
  ready: "Ready",
};

export default function StudentHomePage() {
  return (
    <>
      <section className="hello">
        <p className="meta">{DEMO_DATE_SHORT}</p>
        <h1>Morning, Ada</h1>
        <p>Your tutors are on the desk. Pick one and keep going.</p>
      </section>
      <div className="dash-grid">
        <section className="stack" aria-label="Your tutors">
          {tutors.map((tutor, index) => {
            const face = mascotFor(tutor.subject);
            const href = `/student/tutor/${tutor.id}`;
            return (
              <article
                key={tutor.id}
                className={`tcard ${STATUS_CLASS[tutor.status]}`}
                style={{ ["--z" as string]: 10 - index }}
                tabIndex={0}
              >
                <div className="tc-head">
                  <div className="tc-face" style={{ background: face.tile }}>
                    <Mascot variant={face.variant} smile={face.smile} />
                  </div>
                  <div className="tc-id">
                    <h3>{tutorTitle(tutor.subject)}</h3>
                    <p className="meta">
                      {tutor.level} · {tutor.topic}
                    </p>
                  </div>
                  <span className="tc-time">{tutor.updatedAt}</span>
                </div>
                <div className="tc-body">
                  <span className="status">
                    <i />
                    {STATUS_LABEL[tutor.status]}
                  </span>
                  <p>{tutor.preview}</p>
                </div>
                <div className="tc-foot">
                  <Link className="btn btn-ghost btn-sm" href={href}>
                    Expand
                  </Link>
                  {tutor.status === "in_lesson" ? (
                    <Link className="btn btn-primary btn-sm" href={href}>
                      Continue lesson
                    </Link>
                  ) : (
                    <Link className="tc-link" href={href}>
                      Open tutor
                    </Link>
                  )}
                </div>
              </article>
            );
          })}
          <Link className="add-tutor" href="/student/tutor">
            + Add a subject tutor
          </Link>
        </section>
        <aside className="aside">
          <div className="mini">
            <div>
              <p className="meta">Study streak</p>
              <b>5 days</b>
            </div>
            <div className="dots" aria-label="5 day streak">
              <i className="on" />
              <i className="on" />
              <i className="on" />
              <i className="on" />
              <i className="on" />
              <i />
              <i />
            </div>
          </div>
          <div className="mini col">
            <p className="meta">Do this next</p>
            <Link href="/student/tutor/biology">
              <b>Revise light reactions</b>
              <span>Biology · scored 2/5</span>
            </Link>
            <Link href="/student/quiz/quadratics">
              <b>Retake Quadratics quiz</b>
              <span>Maths · last try 3/5</span>
            </Link>
          </div>
        </aside>
      </div>
    </>
  );
}
