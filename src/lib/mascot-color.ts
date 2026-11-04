/** Locked mascot fills from the student design pack. */
export const MASCOT_BLUE = "#2412B0";
export const MASCOT_ORANGE = "#FF4A1C";
export const MASCOT_YELLOW = "#FBE062";
export const MASCOT_GREEN = "#2F6B4F";

const PALETTE = [MASCOT_BLUE, MASCOT_ORANGE, MASCOT_YELLOW, MASCOT_GREEN];

const LOCKED: { test: RegExp; color: string }[] = [
  { test: /\b(maths?|mathematics|algebra|calculus|arithmetic)\b/i, color: MASCOT_BLUE },
  { test: /\bbiolog/i, color: MASCOT_ORANGE },
  { test: /\b(physics|phys)\b/i, color: MASCOT_YELLOW },
  { test: /\b(english|literature|comprehension)\b/i, color: MASCOT_GREEN },
];

const NAMES: Record<string, string> = {
  [MASCOT_BLUE]: "blue",
  [MASCOT_ORANGE]: "orange",
  [MASCOT_YELLOW]: "yellow",
  [MASCOT_GREEN]: "green",
};

/**
 * Colour for a tutor cloud. Known subjects use the locked hex.
 * Anything else is a stable pick from the same palette, keyed by tutor id.
 */
export function mascotColorFor(course: string, tutorId = ""): string {
  const text = course.trim();
  for (const item of LOCKED) {
    if (item.test.test(text)) return item.color;
  }
  const seed = `${text.toLowerCase()}|${tutorId}`;
  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 33 + seed.charCodeAt(index)) >>> 0;
  }
  return PALETTE[hash % PALETTE.length] ?? MASCOT_BLUE;
}

export function normalizeMascotColor(value: string | null | undefined, course: string, tutorId: string) {
  const hex = value?.trim() ?? "";
  if (/^#[0-9A-Fa-f]{6}$/.test(hex)) return hex.toUpperCase();
  return mascotColorFor(course, tutorId);
}

export function mascotColorName(color: string) {
  return NAMES[color.toUpperCase()] ?? "custom";
}
