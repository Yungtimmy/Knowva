import { isStoredUploadPath } from "./chat-files";
import type { ChatAttachment, ChatAttachmentKind, ResourceBundle, TutorMessage } from "./types";

const KINDS = new Set<ChatAttachmentKind>(["link", "pdf", "image"]);
const URL_RE = /https?:\/\/[^\s<>"')\]]+/gi;

export function messageBody(message: Pick<TutorMessage, "short" | "steps" | "remember" | "next" | "body">) {
  if (message.body?.trim()) return message.body.trim();
  return [message.short, ...(message.steps ?? []), message.remember, message.next ?? ""]
    .map((part) => part?.trim() ?? "")
    .filter(Boolean)
    .join("\n");
}

/** Text the student actually sees, in render order. Search counts these, not a hidden duplicate. */
export function visibleParts(message: Pick<TutorMessage, "role" | "short" | "steps" | "remember" | "next" | "body">) {
  if (message.role === "user") {
    const text = message.short?.trim() || message.body?.trim() || "";
    return text ? [text] : [];
  }
  const parts = [message.short, ...(message.steps ?? []), message.remember, message.next ?? ""]
    .map((part) => part?.trim() ?? "")
    .filter(Boolean);
  if (parts.length > 0) return parts;
  const body = message.body?.trim();
  return body ? [body] : [];
}

export function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Exact, case-insensitive spans. A one-letter query is too broad to jump. */
export function matchSpans(text: string, query: string) {
  const needle = query.trim();
  if (needle.length < 2) return [];
  const re = new RegExp(escapeRegExp(needle), "gi");
  const spans: { start: number; end: number }[] = [];
  for (const match of text.matchAll(re)) {
    if (match.index === undefined) continue;
    spans.push({ start: match.index, end: match.index + match[0].length });
  }
  return spans;
}

export function chatMatchCount(
  messages: Pick<TutorMessage, "role" | "short" | "steps" | "remember" | "next" | "body">[],
  query: string,
) {
  return messages.reduce(
    (sum, message) => sum + visibleParts(message).reduce((count, part) => count + matchSpans(part, query).length, 0),
    0,
  );
}

export function chatDayLabel(iso: string | undefined, now = new Date()) {
  if (!iso) return "Today";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "Today";
  const start = (value: Date) => new Date(value.getFullYear(), value.getMonth(), value.getDate()).getTime();
  if (start(now) === start(date)) return "Today";
  return date.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
}

export function groupMessagesByDay<T extends { createdAt?: string }>(messages: T[], now = new Date()) {
  const groups: { label: string; messages: T[] }[] = [];
  for (const message of messages) {
    const label = chatDayLabel(message.createdAt, now);
    const last = groups[groups.length - 1];
    if (last?.label === label) last.messages.push(message);
    else groups.push({ label, messages: [message] });
  }
  return groups;
}

function kindForUrl(url: string): ChatAttachmentKind {
  if (/\.(png|jpe?g|gif|webp)(\?|$)/i.test(url)) return "image";
  if (/\.pdf(\?|$)/i.test(url)) return "pdf";
  return "link";
}

export function attachmentsFromText(text: string): ChatAttachment[] {
  const found = text.match(URL_RE) ?? [];
  const items: ChatAttachment[] = [];
  for (const raw of found) {
    const url = raw.replace(/[.,;:]+$/, "");
    if (url.length > 500) continue;
    let title = url;
    try {
      title = new URL(url).hostname.replace(/^www\./, "");
    } catch {
      continue;
    }
    items.push({ kind: kindForUrl(url), title, url });
    if (items.length >= 8) break;
  }
  return items;
}

export function attachmentsFromResources(bundle: ResourceBundle | null): ChatAttachment[] {
  if (!bundle) return [];
  const items: ChatAttachment[] = [];
  for (const item of [...bundle.primary, ...bundle.alternates]) {
    if (!item.url || !/^https?:\/\//i.test(item.url)) continue;
    const kind: ChatAttachmentKind =
      kindForUrl(item.url) === "image" ? "image" : item.type === "pdf" || kindForUrl(item.url) === "pdf" ? "pdf" : "link";
    items.push({ kind, title: item.title.slice(0, 160), url: item.url });
  }
  return items;
}

const ATTACHMENT_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function readAttachment(item: unknown): ChatAttachment | null {
  if (!item || typeof item !== "object") return null;
  const row = item as { kind?: unknown; title?: unknown; url?: unknown; storagePath?: unknown; attachmentId?: unknown; pages?: unknown };
  if (typeof row.kind !== "string" || !KINDS.has(row.kind as ChatAttachmentKind)) return null;
  const storagePath = typeof row.storagePath === "string" && isStoredUploadPath(row.storagePath) ? row.storagePath : undefined;
  const url = typeof row.url === "string" && /^https?:\/\//i.test(row.url) ? row.url : "";
  if (!storagePath && !url) return null;
  const titleSource = typeof row.title === "string" && row.title.trim() ? row.title : url || storagePath || "File";
  const pages = typeof row.pages === "number" && Number.isInteger(row.pages) && row.pages >= 0 && row.pages < 5000 ? row.pages : undefined;
  const attachmentId = typeof row.attachmentId === "string" && ATTACHMENT_ID.test(row.attachmentId) ? row.attachmentId : undefined;
  return {
    kind: row.kind as ChatAttachmentKind,
    title: titleSource.slice(0, 160),
    url,
    storagePath,
    attachmentId,
    pages,
  };
}

export function mergeAttachments(...groups: ChatAttachment[][]) {
  const seen = new Set<string>();
  const items: ChatAttachment[] = [];
  for (const group of groups) {
    for (const item of group) {
      const clean = readAttachment(item);
      if (!clean) continue;
      const key = clean.storagePath || clean.url;
      if (seen.has(key)) continue;
      seen.add(key);
      items.push(clean);
      if (items.length >= 8) return items;
    }
  }
  return items;
}

export function normalizeAttachments(value: unknown): ChatAttachment[] {
  if (!Array.isArray(value)) return [];
  return mergeAttachments(value.flatMap((item) => {
    const clean = readAttachment(item);
    return clean ? [clean] : [];
  }));
}

export function asStoredMessage(message: TutorMessage, extras?: { attachments?: ChatAttachment[] }): TutorMessage {
  const attachments = mergeAttachments(message.attachments ?? [], extras?.attachments ?? []);
  return {
    role: message.role,
    short: message.short,
    steps: message.steps ?? [],
    remember: message.remember ?? "",
    next: message.next,
    id: message.id && message.id.length > 0 ? message.id : crypto.randomUUID(),
    createdAt: message.createdAt ?? new Date().toISOString(),
    body: messageBody(message),
    attachments,
  };
}
