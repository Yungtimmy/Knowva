"use client";

import { useParams } from "next/navigation";
import { TutorProfile } from "@/components/student/TutorProfile";

export default function TutorProfilePage() {
  const params = useParams<{ sessionId: string }>();
  return <TutorProfile tutorId={params.sessionId} />;
}
