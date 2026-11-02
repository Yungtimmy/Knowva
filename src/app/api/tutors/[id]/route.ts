import { NextResponse } from "next/server";
import { parseBody, readJson } from "@/lib/http";
import { resolveOwner } from "@/lib/owner";
import { tutorPatchSchema } from "@/lib/schemas";
import { deleteTutor, getTutor, updateTutor } from "@/lib/tutor-repo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: Context) {
  const { id } = await context.params;
  const owner = await resolveOwner();
  const tutor = await getTutor(owner, id);
  if (!tutor) return NextResponse.json({ error: "Tutor not found." }, { status: 404 });
  return NextResponse.json({ tutor, persisted: owner.persisted });
}

export async function PATCH(request: Request, context: Context) {
  const { id } = await context.params;
  const parsed = parseBody(tutorPatchSchema, await readJson(request));
  if (!parsed.ok) return parsed.response;
  const owner = await resolveOwner();
  const tutor = await updateTutor(owner, id, parsed.data);
  if (!tutor) return NextResponse.json({ error: "Tutor not found." }, { status: 404 });
  return NextResponse.json({ tutor, persisted: owner.persisted });
}

export async function DELETE(_request: Request, context: Context) {
  const { id } = await context.params;
  const owner = await resolveOwner();
  const removed = await deleteTutor(owner, id);
  if (!removed) return NextResponse.json({ error: "Tutor not found." }, { status: 404 });
  return NextResponse.json({ ok: true });
}
