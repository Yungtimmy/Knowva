import { NextResponse } from "next/server";
import { CHAT_BUCKET, canRemoveUpload, planSignedUpload, type UploadActor } from "@/lib/chat-files";
import { parseBody, readJson } from "@/lib/http";
import { resolveOwner } from "@/lib/owner";
import { uploadRemoveSchema, uploadTicketSchema } from "@/lib/schemas";
import { getTutor, type Owner } from "@/lib/tutor-repo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string }> };

function actorOf(owner: Owner): UploadActor {
  return { id: owner.id, persisted: owner.persisted, hasSession: Boolean(owner.supabase) };
}

export async function POST(request: Request, context: Context) {
  const { id } = await context.params;
  const parsed = parseBody(uploadTicketSchema, await readJson(request));
  if (!parsed.ok) return parsed.response;
  const owner = await resolveOwner();
  const tutor = owner.persisted === "supabase" ? await getTutor(owner, id) : null;
  const planned = await planSignedUpload({
    actor: actorOf(owner),
    tutorId: tutor?.id ?? id,
    tutorOwned: Boolean(tutor),
    filename: parsed.data.filename,
    mime: parsed.data.mime,
    size: parsed.data.size,
    fileId: crypto.randomUUID(),
    sign: async (path) => {
      if (!owner.supabase) return null;
      const { data, error } = await owner.supabase.storage.from(CHAT_BUCKET).createSignedUploadUrl(path);
      if (error || !data?.signedUrl) return null;
      return data.signedUrl;
    },
  });
  if (!planned.ok) return NextResponse.json({ error: planned.error }, { status: planned.status });
  return NextResponse.json({ path: planned.path, signedUrl: planned.signedUrl });
}

export async function DELETE(request: Request, context: Context) {
  const { id } = await context.params;
  const parsed = parseBody(uploadRemoveSchema, await readJson(request));
  if (!parsed.ok) return parsed.response;
  const owner = await resolveOwner();
  const tutor = owner.persisted === "supabase" ? await getTutor(owner, id) : null;
  const allowed = canRemoveUpload(actorOf(owner), tutor?.id ?? id, parsed.data.path);
  if (!allowed.ok) return NextResponse.json({ error: allowed.error }, { status: allowed.status });
  if (!owner.supabase) return NextResponse.json({ error: "Sign in to attach a file." }, { status: 401 });
  const { error } = await owner.supabase.storage.from(CHAT_BUCKET).remove([allowed.path]);
  if (error) return NextResponse.json({ error: "Could not remove that file." }, { status: 500 });
  return NextResponse.json({ ok: true });
}
