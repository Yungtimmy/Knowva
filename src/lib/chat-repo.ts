import { CHAT_BUCKET, SIGNED_URL_SECONDS, isOwnChatUploadPath } from "./chat-files";
import { asStoredMessage, normalizeAttachments } from "./chat-thread";
import type { PreparedUpload } from "./chat-uploads";
import { readBucket, updateBucket } from "./session-store";
import type { Owner } from "./tutor-repo";
import type { ChatAttachment, TutorMessage } from "./types";

type MessageRow = {
  id: string;
  role: string;
  body: string | null;
  short: string | null;
  steps: unknown;
  remember: string | null;
  next: string | null;
  attachments: unknown;
  created_at: string;
};

function fromRow(row: MessageRow): TutorMessage | null {
  if (row.role !== "user" && row.role !== "tutor") return null;
  const steps = Array.isArray(row.steps)
    ? row.steps.filter((step): step is string => typeof step === "string").slice(0, 8)
    : [];
  const short = (row.short ?? "").trim() || (row.body ?? "").trim();
  return {
    id: row.id,
    createdAt: row.created_at,
    role: row.role,
    short,
    steps,
    remember: row.remember ?? "",
    next: row.next ?? undefined,
    body: (row.body ?? "").trim() || short,
    attachments: normalizeAttachments(row.attachments),
  };
}

function toInsert(message: TutorMessage, userId: string, tutorId: string) {
  return {
    id: message.id,
    user_id: userId,
    tutor_id: tutorId,
    role: message.role,
    body: (message.body ?? message.short).slice(0, 8000),
    short: message.short.slice(0, 2000),
    steps: message.steps.slice(0, 8),
    remember: message.remember.slice(0, 500),
    next: message.next?.slice(0, 500) ?? null,
    attachments: (message.attachments ?? []).slice(0, 8),
    created_at: message.createdAt,
  };
}

async function signAttachments(owner: Owner, tutorId: string, attachments: ChatAttachment[] | undefined) {
  if (!attachments || attachments.length === 0 || !owner.supabase) return attachments;
  const paths = attachments.flatMap((item) =>
    item.storagePath && isOwnChatUploadPath(item.storagePath, owner.id, tutorId) ? [item.storagePath] : [],
  );
  if (paths.length === 0) return attachments;
  const { data, error } = await owner.supabase.storage.from(CHAT_BUCKET).createSignedUrls(paths, SIGNED_URL_SECONDS);
  if (error || !data) return attachments;
  const urls = new Map<string, string>();
  for (const row of data) {
    if (row.path && row.signedUrl && /^https?:\/\//i.test(row.signedUrl)) urls.set(row.path, row.signedUrl);
  }
  return attachments.map((item) => {
    const signed = item.storagePath ? urls.get(item.storagePath) : undefined;
    return signed ? { ...item, url: signed } : item;
  });
}

async function signMessages(owner: Owner, tutorId: string, messages: TutorMessage[]) {
  const signed: TutorMessage[] = [];
  for (const message of messages) {
    signed.push({ ...message, attachments: await signAttachments(owner, tutorId, message.attachments) });
  }
  return signed;
}

export async function listTutorMessages(owner: Owner, tutorId: string) {
  if (owner.persisted === "supabase" && owner.supabase) {
    const { data, error } = await owner.supabase
      .from("tutor_messages")
      .select("id, role, body, short, steps, remember, next, attachments, created_at")
      .eq("tutor_id", tutorId)
      .order("created_at", { ascending: true })
      .limit(1000);
    if (error) throw new Error("Could not load this chat.");
    const messages =
      (data as MessageRow[] | null)?.flatMap((row) => {
        const message = fromRow(row);
        return message ? [message] : [];
      }) ?? [];
    return signMessages(owner, tutorId, messages);
  }
  const bucket = await readBucket(owner.id);
  return (bucket.threads?.[tutorId] ?? []).map((message) => asStoredMessage(message));
}

export async function appendTutorMessages(owner: Owner, tutorId: string, messages: TutorMessage[], uploads?: PreparedUpload[]) {
  const stamped = messages.map((message) => asStoredMessage(message));
  const now = stamped[stamped.length - 1]?.createdAt ?? new Date().toISOString();
  if (owner.persisted === "supabase" && owner.supabase) {
    const { error } = await owner.supabase
      .from("tutor_messages")
      .insert(stamped.map((message) => toInsert(message, owner.id, tutorId)));
    if (error) throw new Error("Could not save this chat.");
    if (uploads && uploads.length > 0) {
      const { error: attachmentError } = await owner.supabase.from("message_attachments").insert(
        uploads.map((item) => ({
          id: item.id,
          user_id: owner.id,
          tutor_id: tutorId,
          message_id: item.messageId,
          kind: item.kind,
          filename: item.filename.slice(0, 180),
          mime_type: item.mime,
          size_bytes: item.size,
          storage_path: item.path,
          page_count: item.pages,
          extracted_text: item.extractedText,
        })),
      );
      if (attachmentError) throw new Error("Could not save this chat.");
    }
    await owner.supabase.from("tutors").update({ last_chat_at: now }).eq("id", tutorId);
    return listTutorMessages(owner, tutorId);
  }
  return updateBucket(owner.id, (bucket) => {
    bucket.threads ??= {};
    const thread = bucket.threads[tutorId] ?? [];
    bucket.threads[tutorId] = [...thread, ...stamped];
    const tutor = bucket.tutors.find((item) => item.id === tutorId);
    if (tutor) tutor.lastChatAt = now;
    return bucket.threads[tutorId];
  });
}
