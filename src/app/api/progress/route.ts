import { NextResponse } from "next/server";
import { resolveOwner } from "@/lib/owner";
import { buildProgress } from "@/lib/test-repo";
import { listTutors } from "@/lib/tutor-repo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const owner = await resolveOwner();
  const tutors = await listTutors(owner);
  const progress = await buildProgress(owner, tutors);
  return NextResponse.json({ progress, persisted: owner.persisted });
}
