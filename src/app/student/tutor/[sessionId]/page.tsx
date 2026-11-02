import Link from "next/link";
import { TutorDesk } from "@/components/student/TutorDesk";
import { tutors } from "@/lib/demo";

export default async function TutorSessionPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;
  const tutor = tutors.find((item) => item.id === sessionId);
  if (!tutor) {
    return (
      <>
        <Link className="back" href="/student">
          ← Home
        </Link>
        <section className="card" style={{ marginTop: 12 }}>
          <h1>That tutor is not on the desk</h1>
          <p>Add a subject tutor and pick a topic you are studying.</p>
          <Link className="btn btn-primary" href="/student/tutor" style={{ marginTop: 12 }}>
            Add a tutor
          </Link>
        </section>
      </>
    );
  }
  return <TutorDesk tutor={tutor} />;
}
