import type { ResourceType } from "./types";

export const OPTION_LETTERS = ["A", "B", "C", "D", "E", "F"] as const;

export function levelLabel(level: string) {
  if (level === "beginner") return "Beginner";
  if (level === "intermediate") return "Intermediate";
  if (level === "advanced") return "Advanced";
  return level;
}

export function clip(text: string, max: number) {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  const slice = clean.slice(0, Math.max(1, max - 3));
  const word = slice.lastIndexOf(" ");
  const trimmed = (word > 12 ? slice.slice(0, word) : slice).trimEnd();
  return `${trimmed}...`;
}

export function greeting(now = new Date()) {
  const hour = now.getHours();
  if (hour < 12) return "Morning";
  if (hour < 17) return "Afternoon";
  return "Evening";
}

export function deskDate(now = new Date()) {
  return now.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "short" });
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

export function shortWhen(iso: string | null | undefined, now = new Date()) {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const diff = Math.round((startOfDay(now) - startOfDay(date)) / 86_400_000);
  if (diff <= 0) return "Today";
  if (diff === 1) return "Yesterday";
  if (diff < 7) return date.toLocaleDateString("en-GB", { weekday: "short" });
  return date.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
}

/** Clock time when the tutor was updated today, otherwise a short day label. */
export function cardTime(iso: string, now = new Date()) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  if (startOfDay(now) === startOfDay(date)) {
    return date.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  }
  return shortWhen(iso, now);
}

export function streakDays(isos: Array<string | null | undefined>, now = new Date()) {
  const keys = new Set<string>();
  for (const iso of isos) {
    if (!iso) continue;
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) continue;
    keys.add(`${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`);
  }
  if (keys.size === 0) return 0;
  const cursor = new Date(now);
  const keyFor = (date: Date) => `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
  if (!keys.has(keyFor(cursor))) {
    cursor.setDate(cursor.getDate() - 1);
    if (!keys.has(keyFor(cursor))) return 0;
  }
  let count = 0;
  while (keys.has(keyFor(cursor))) {
    count += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return count;
}

const TOPIC_SPLIT = /\s*(?:,|;|\band\b)\s*/i;

export function topicsMatch(a: string, b: string) {
  const norm = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, "");
  return norm(a).length > 0 && norm(a) === norm(b);
}

/** Search stubs repeat the topic when it is also sent as the subject. Show it once. */
export function undouble(text: string) {
  const parts = text.trim().split(/\s+/);
  if (parts.length >= 2 && parts.length % 2 === 0) {
    const mid = parts.length / 2;
    const left = parts.slice(0, mid).join(" ");
    const right = parts.slice(mid).join(" ");
    if (left.toLowerCase() === right.toLowerCase()) return left;
  }
  return text;
}

export function topicSeeds(focus: string) {
  const parts = focus
    .split(TOPIC_SPLIT)
    .map((part) => part.replace(/\b(before|after|during|for my|for the)\b.*$/i, "").replace(/[.]/g, "").trim())
    .filter((part) => part.length >= 3 && part.length <= 48);
  return [...new Set(parts)].slice(0, 6);
}

export function resourceTypeLabel(type: ResourceType | string) {
  if (type === "youtube") return "Video";
  if (type === "pdf" || type === "notes") return "Notes";
  if (type === "practice") return "Practice";
  return "Link";
}

export function questionTag(id: string, index: number) {
  const match = /q(\d+)/i.exec(id);
  if (match?.[1]) return `Q${match[1]}`;
  return `Q${index + 1}`;
}

export function withLetter(option: string, index: number) {
  if (/^[A-F][.)]\s/.test(option)) return option;
  const letter = OPTION_LETTERS[index];
  return letter ? `${letter}. ${option}` : option;
}
