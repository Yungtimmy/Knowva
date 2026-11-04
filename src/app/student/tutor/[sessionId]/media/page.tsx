"use client";

import { useParams } from "next/navigation";
import { TutorMedia } from "@/components/student/TutorMedia";

export default function TutorMediaPage() {
  const params = useParams<{ sessionId: string }>();
  return <TutorMedia tutorId={params.sessionId} />;
}
