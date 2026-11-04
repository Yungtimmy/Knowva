import { NextResponse } from "next/server";
import { listTutorMessages } from "@/lib/chat-repo";
import { resolveOwner } from "@/lib/owner";
import { getTutor } from "@/lib/tutor-repo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: Context) {
  const { id } = await context.params;
  const owner = await resolveOwner();
  const tutor = await getTutor(owner, id);
  if (!tutor) return NextResponse.json({ error: "Tutor not found." }, { status: 404 });
  try {
    const messages = await listTutorMessages(owner, id);
    return NextResponse.json({ messages, tutorId: tutor.id });
  } catch (error) {
    console.error("GET /api/tutors/[id]/messages", error instanceof Error ? error.name : "error");
    return NextResponse.json({ error: "Could not load this chat." }, { status: 500 });
  }
}
