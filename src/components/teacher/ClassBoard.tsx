import Link from "next/link";
import { ClassSwitcher } from "./ClassSwitcher";
import { classes, classSnapshots } from "@/lib/demo";
import { withTopicStatus } from "@/lib/gap";
import type { TopicStat } from "@/lib/types";

const LABEL: Record<TopicStat["status"], string> = {
  gap: "Gap",
  watch: "Watch",
  on_track: "On track",
};

const TAG: Record<TopicStat["status"], string> = {
  gap: "tag low",
  watch: "tag draft",
  on_track: "tag ok",
};

export function ClassBoard({ classId }: { classId: string }) {
  const room = classes.find((item) => item.id === classId);
  const snapshot = classSnapshots[classId];
  if (!room || !snapshot) {
    return (
      <>
        <h1>No class with that id</h1>
        <p>Open a class from the list.</p>
        <Link href="/teacher/class/ss2a">CSC 201 A</Link>
      </>
    );
  }
  const topics = snapshot.topics.map((topic) => withTopicStatus(topic));

  return (
    <>
      <div className="head">
        <div>
          <p className="meta">Class insights · sample data</p>
          <h1>
            {room.name} · {room.subject}
          </h1>
        </div>
        <div className="actions">
          <ClassSwitcher classes={classes} current={room.id} />
          <select style={{ width: "auto" }} aria-label="Term" defaultValue="This term">
            <option>This term</option>
          </select>
        </div>
      </div>
      <div className="two" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
        <div className="card">
          <p className="meta">Students</p>
          <h1>{room.studentCount}</h1>
        </div>
        <div className="card">
          <p className="meta">Quizzes taken</p>
          <h1>{snapshot.quizzesTaken}</h1>
        </div>
        <div className="card">
          <p className="meta">Class average</p>
          <h1>{snapshot.classAverage}%</h1>
        </div>
      </div>
      <div className="grid">
        <div className="card">
          <h2>Topic performance</h2>
          <table>
            <tbody>
              <tr>
                <th>Topic</th>
                <th>Average</th>
                <th />
                <th>Attempts</th>
                <th>Status</th>
                <th />
              </tr>
              {topics.map((topic) => (
                <tr key={topic.topic}>
                  <td>
                    <b>{topic.topic}</b>
                  </td>
                  <td>{topic.avg}%</td>
                  <td>
                    <div className={topic.status === "gap" ? "bar low" : "bar"}>
                      <i style={{ width: `${topic.avg}%` }} />
                    </div>
                  </td>
                  <td>{topic.attempts}</td>
                  <td>
                    <span className={TAG[topic.status]}>{LABEL[topic.status]}</span>
                  </td>
                  <td>
                    {topic.status === "gap" ? (
                      <Link
                        className="btn btn-ghost btn-sm"
                        href={
                          /square|factor/i.test(topic.topic)
                            ? `/teacher/lesson/new?topic=${encodeURIComponent(topic.topic)}`
                            : `/teacher/quiz/new?topic=${encodeURIComponent(topic.topic)}`
                        }
                      >
                        {/square|factor/i.test(topic.topic) ? "Re-teach outline" : "Practice quiz"}
                      </Link>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="meta" style={{ marginTop: 10 }}>
            Gap means the class average is below 60%. Numbers here are sample data for the mock.
          </p>
        </div>
        <div>
          <div className="card">
            <h2>Most missed questions</h2>
            <table>
              <tbody>
                {snapshot.missed.map((item) => (
                  <tr key={item.prompt}>
                    <td>
                      <b>{item.prompt}</b>
                      <br />
                      <span className="meta">
                        {item.topic} · {item.wrongPct}% wrong
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="card">
            <h2>Students needing support</h2>
            <p>{snapshot.supportCount} students scored below 50% on two or more topics.</p>
            <p className="meta" style={{ marginTop: 6 }}>
              Names show only to you. Shown as counts in this mock.
            </p>
            <details style={{ marginTop: 10 }}>
              <summary className="btn btn-ghost btn-sm">View list</summary>
              <p className="meta" style={{ marginTop: 8 }}>
                Names stay off this demo. The count is {snapshot.supportCount}.
              </p>
            </details>
          </div>
        </div>
      </div>
    </>
  );
}
