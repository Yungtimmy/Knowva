import Link from "next/link";
import { DEMO_DATE_LONG, classLabel, generationHref, generations } from "@/lib/demo";

const TYPE_LABEL = {
  lesson: "Lesson outline",
  notes: "Notes",
  quiz: "Quiz + key",
  marking_guide: "Marking guide",
} as const;

export default function TeacherHomePage() {
  return (
    <>
      <div className="head">
        <div>
          <p className="meta">{DEMO_DATE_LONG}</p>
          <h1>Good morning, Dr. Adeyemi</h1>
        </div>
        <Link className="btn btn-primary" href="/teacher/lesson/new">
          Generate lesson outline
        </Link>
      </div>
      <div className="grid">
        <div>
          <div className="card">
            <h2>Quick actions</h2>
            <div className="quick">
              <Link href="/teacher/lesson/new">
                <b>Lesson outline</b>
                Objectives, timing and notes for one topic.
              </Link>
              <Link href="/teacher/quiz/new">
                <b>Quiz</b>
                Multiple choice and short answer, with an answer key.
              </Link>
              <Link href="/teacher/quiz/new?kind=marking_guide">
                <b>Marking guide</b>
                Mark scheme for theory questions.
              </Link>
              <Link href="/teacher/class">
                <b>Find topic gaps</b>
                See which topics the group missed most.
              </Link>
            </div>
          </div>
          <div className="card">
            <div className="head" style={{ marginBottom: 8 }}>
              <h2 style={{ margin: 0 }}>Recent generations</h2>
              <span className="meta">Last 7 days</span>
            </div>
            <table>
              <tbody>
                <tr>
                  <th>Title</th>
                  <th>Type</th>
                  <th>Class</th>
                  <th>Status</th>
                  <th>Updated</th>
                  <th />
                </tr>
                {generations.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <b>{item.title}</b>
                    </td>
                    <td>{TYPE_LABEL[item.type]}</td>
                    <td>{classLabel(item.classId)}</td>
                    <td>
                      <span className={item.status === "reviewed" ? "tag ok" : "tag draft"}>
                        {item.status === "reviewed" ? "Reviewed" : "Needs review"}
                      </span>
                    </td>
                    <td>{item.updatedAt}</td>
                    <td>
                      <Link className="btn btn-ghost btn-sm" href={generationHref(item)}>
                        Open
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div>
          <div className="card">
            <h2>Courses you teach</h2>
            <table>
              <tbody>
                <tr>
                  <td>
                    <b>Prompt engineering</b>
                    <br />
                    <span className="meta">CSC 201 A, CSC 201 B</span>
                  </td>
                  <td style={{ textAlign: "right" }}>12 items</td>
                </tr>
                <tr>
                  <td>
                    <b>Software engineering</b>
                    <br />
                    <span className="meta">CSC 101 A</span>
                  </td>
                  <td style={{ textAlign: "right" }}>7 items</td>
                </tr>
                <tr>
                  <td>
                    <b>Web APIs</b>
                    <br />
                    <span className="meta">CSC 301 A</span>
                  </td>
                  <td style={{ textAlign: "right" }}>4 items</td>
                </tr>
              </tbody>
            </table>
            <Link className="btn btn-ghost btn-sm" href="/teacher/lesson/new" style={{ marginTop: 12 }}>
              Add a course
            </Link>
          </div>
          <div className="card">
            <h2>Saved materials</h2>
            <table>
              <tbody>
                <tr>
                  <td>
                    <b>Week 6 lab pack</b>
                    <br />
                    <span className="meta">CSC 201 · 6 files</span>
                  </td>
                </tr>
                <tr>
                  <td>
                    <b>Git notes</b>
                    <br />
                    <span className="meta">CSC 101 · edited Oct 28</span>
                  </td>
                </tr>
                <tr>
                  <td>
                    <b>API design paper</b>
                    <br />
                    <span className="meta">CSC 301 · with marking guide</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="card" style={{ background: "var(--kn-cream)" }}>
            <h3>Topic gap this week</h3>
            <p style={{ marginTop: 4 }}>CSC 201 A averaged 48% on few-shot examples. A short re-teach outline may help.</p>
            <Link className="btn btn-ghost btn-sm" href="/teacher/class/ss2a" style={{ marginTop: 10 }}>
              See class insights
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
