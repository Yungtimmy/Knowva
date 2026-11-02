import { NextResponse } from "next/server";
import { parseBody, readJson } from "@/lib/http";
import { resolveOwner } from "@/lib/owner";
import { tutorWriteSchema } from "@/lib/schemas";
import { TUTOR_CAP } from "@/lib/types";
import { createTutor, listTutors } from "@/lib/tutor-repo";
import { TutorCapError } from "@/lib/tutors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function failed(error: unknown) {
  if (error instanceof TutorCapError) return NextResponse.json({ error: error.message }, { status: 409 });
  return NextResponse.json({ error: "Could not save the tutor." }, { status: 500 });
}

export async function GET() {
  const owner = await resolveOwner();
  const tutors = await listTutors(owner);
  return NextResponse.json({
    tutors,
    persisted: owner.persisted,
    cap: TUTOR_CAP,
    remaining: Math.max(0, TUTOR_CAP - tutors.length),
  });
}

export async function POST(request: Request) {
  const parsed = parseBody(tutorWriteSchema, await readJson(request));
  if (!parsed.ok) return parsed.response;
  const owner = await resolveOwner();
  try {
    const tutor = await createTutor(owner, parsed.data);
    return NextResponse.json({ tutor, persisted: owner.persisted, cap: TUTOR_CAP }, { status: 201 });
  } catch (error) {
    return failed(error);
  }
}
