import { CHAT_BUCKET, capExtractedText, isOwnChatUploadPath, sniffChatMime, wrapUploadedDocuments, type ChatUploadMime } from "./chat-files";
import { describeImage } from "./llm";
import { extractPdfDocument } from "./pdf-text";
import type { Owner } from "./tutor-repo";
import type { ChatAttachment } from "./types";

const UNREAD_PDF = "No text layer could be read from this PDF. Scanned pages are not available in this file.";
const UNREAD_IMAGE = "The image could not be read.";

export class ChatUploadError extends Error {
  readonly status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = "ChatUploadError";
    this.status = status;
  }
}

export type PreparedUpload = {
  id: string;
  messageId: string;
  path: string;
  filename: string;
  mime: ChatUploadMime;
  kind: "pdf" | "image";
  size: number;
  pages: number | null;
  extractedText: string | null;
  promptBody: string;
};

type UploadRef = { path: string; filename: string; mime: ChatUploadMime; size: number };

export async function prepareChatUploads(
  owner: Owner,
  tutorId: string,
  refs: UploadRef[],
  messageId: string,
  options?: { describeImages?: boolean },
) {
  if (owner.persisted !== "supabase" || !owner.supabase) {
    throw new ChatUploadError("Sign in to attach a file.");
  }
  const seen = new Set<string>();
  const prepared: PreparedUpload[] = [];
  for (const ref of refs) {
    if (seen.has(ref.path)) throw new ChatUploadError("That file is already attached.");
    seen.add(ref.path);
    if (!isOwnChatUploadPath(ref.path, owner.id, tutorId)) {
      throw new ChatUploadError("That file is not in your uploads.");
    }
    const { data, error } = await owner.supabase.storage.from(CHAT_BUCKET).download(ref.path);
    if (error || !data) throw new ChatUploadError("That file is not in your uploads.");
    const bytes = new Uint8Array(await data.arrayBuffer());
    if (bytes.byteLength <= 0 || bytes.byteLength > 10 * 1024 * 1024) {
      throw new ChatUploadError("That file is too big. Each file must be 10 MB or smaller.");
    }
    const sniffed = sniffChatMime(bytes);
    if (!sniffed || sniffed !== ref.mime) throw new ChatUploadError("Use a PDF, PNG, JPG, or WebP.");
    const objectName = ref.path.split("/").pop() ?? "";
    const filename = objectName.length > 37 ? objectName.slice(37) : ref.filename;
    prepared.push(await readUpload(bytes, sniffed, { ...ref, filename, messageId }, options?.describeImages !== false));
  }
  return prepared;
}

async function readUpload(
  bytes: Uint8Array,
  mime: ChatUploadMime,
  ref: UploadRef & { messageId: string },
  describeImages: boolean,
): Promise<PreparedUpload> {
  const id = crypto.randomUUID();
  if (mime === "application/pdf") {
    const extracted = await extractPdfDocument(bytes);
    const capped = capExtractedText(extracted.text);
    const readable = capped.text.trim().length >= 8;
    return {
      id,
      messageId: ref.messageId,
      path: ref.path,
      filename: ref.filename,
      mime,
      kind: "pdf",
      size: bytes.byteLength,
      pages: extracted.pages && extracted.pages > 0 && extracted.pages < 5000 ? extracted.pages : null,
      extractedText: readable ? capped.text : null,
      promptBody: readable ? capped.text : UNREAD_PDF,
    };
  }
  const description = describeImages ? await describeImage(bytes, mime) : null;
  return {
    id,
    messageId: ref.messageId,
    path: ref.path,
    filename: ref.filename,
    mime,
    kind: "image",
    size: bytes.byteLength,
    pages: null,
    extractedText: description,
    promptBody: description ?? UNREAD_IMAGE,
  };
}

export function uploadPrompt(uploads: PreparedUpload[]) {
  if (uploads.length === 0) return "";
  return wrapUploadedDocuments(uploads.map((item) => ({ name: item.filename, kind: item.kind, body: item.promptBody })));
}

export function uploadAttachments(uploads: PreparedUpload[]): ChatAttachment[] {
  return uploads.map((item) => ({
    kind: item.kind,
    title: item.filename,
    url: "",
    storagePath: item.path,
    attachmentId: item.id,
    pages: item.pages ?? undefined,
  }));
}

export type SavedAttachment = {
  id: string;
  kind: "pdf" | "image";
  filename: string;
  extractedText: string | null;
  tutorId: string;
};

export async function getOwnAttachment(owner: Owner, attachmentId: string): Promise<SavedAttachment | null> {
  if (!owner.supabase) return null;
  const { data, error } = await owner.supabase
    .from("message_attachments")
    .select("id, kind, filename, extracted_text, tutor_id")
    .eq("id", attachmentId)
    .maybeSingle();
  if (error || !data) return null;
  const row = data as { id: string; kind: string; filename: string; extracted_text: string | null; tutor_id: string };
  if (row.kind !== "pdf" && row.kind !== "image") return null;
  return {
    id: row.id,
    kind: row.kind,
    filename: row.filename,
    extractedText: row.extracted_text,
    tutorId: row.tutor_id,
  };
}
