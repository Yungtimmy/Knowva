import { COURSE_SET } from "./courses";
import { emailLocal, initials } from "./student-format";

export const USERNAME_PATTERN = /^[a-z0-9_.]{3,20}$/;

export type ProfileFields = {
  displayName: string;
  username: string;
  age: number | null;
  interests: string[];
};

export type ProfileRow = {
  display_name?: string | null;
  username?: string | null;
  age?: number | string | null;
  interests?: unknown;
} | null;

export function profileFromRow(row: ProfileRow): ProfileFields {
  const interests = Array.isArray(row?.interests)
    ? row.interests.filter((item): item is string => typeof item === "string" && COURSE_SET.has(item))
    : [];
  const rawAge = row?.age;
  const age =
    typeof rawAge === "number" && Number.isInteger(rawAge)
      ? rawAge
      : typeof rawAge === "string" && /^\d+$/.test(rawAge)
        ? Number(rawAge)
        : null;
  return {
    displayName: (row?.display_name ?? "").trim(),
    username: (row?.username ?? "").trim().toLowerCase(),
    age,
    interests,
  };
}

export function isProfileComplete(fields: ProfileFields) {
  return (
    fields.displayName.length >= 1 &&
    fields.displayName.length <= 80 &&
    USERNAME_PATTERN.test(fields.username) &&
    fields.age !== null &&
    fields.age >= 10 &&
    fields.age <= 99 &&
    fields.interests.length >= 1 &&
    fields.interests.every((item) => COURSE_SET.has(item))
  );
}

export function googleNameFrom(metadata: Record<string, unknown> | null | undefined) {
  const meta = metadata ?? {};
  for (const key of ["full_name", "name", "display_name"]) {
    const value = meta[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "";
}

/** Saved name after onboarding. Otherwise Google, then the email local-part. Never a demo name. */
export function resolveGreetingName(
  fields: ProfileFields,
  hints: { googleName?: string; email?: string },
) {
  const stored = fields.displayName.trim();
  if (isProfileComplete(fields) && stored) return stored;
  if (stored && stored !== "Learner") return stored;
  const google = (hints.googleName ?? "").trim();
  const local = emailLocal(hints.email ?? "");
  return google || local || "there";
}

export function suggestedProfileName(fields: ProfileFields, hints: { googleName?: string; email?: string }) {
  const stored = fields.displayName.trim();
  if (stored && stored !== "Learner") return stored;
  return (hints.googleName ?? "").trim() || emailLocal(hints.email ?? "");
}

export function presentProfile(
  row: ProfileRow,
  user: { email?: string | null; user_metadata?: Record<string, unknown> | null },
) {
  const fields = profileFromRow(row);
  const hints = { googleName: googleNameFrom(user.user_metadata), email: user.email ?? "" };
  const greetingName = resolveGreetingName(fields, hints);
  return {
    ...fields,
    complete: isProfileComplete(fields),
    greetingName,
    suggestedName: suggestedProfileName(fields, hints),
    initials: initials(greetingName),
  };
}

export type PresentedProfile = ReturnType<typeof presentProfile>;
