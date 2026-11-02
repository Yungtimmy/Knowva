import type { GenerationStatus } from "./types";

/** Generation status must be reviewed before the draft is assigned to a class. */
export function canAssign(
  status: GenerationStatus,
): { ok: true } | { ok: false; error: string } {
  if (status !== "reviewed") {
    return {
      ok: false,
      error: "Mark this as reviewed before assigning it to a class.",
    };
  }
  return { ok: true };
}
