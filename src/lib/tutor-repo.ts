import type { SupabaseClient } from "@supabase/supabase-js";
import { normalizeMascotColor, mascotColorFor } from "./mascot-color";
import { readBucket, updateBucket } from "./session-store";
import { TUTOR_CAP, type LearningGoal, type LearningLevel, type ExplanationStyle, type Tutor } from "./types";
import { TutorCapError, canCreateTutor } from "./tutors";

export type Owner = {
  id: string;
  supabase: SupabaseClient | null;
  persisted: "supabase" | "session";
};

type TutorRow = {
  id: string;
  name: string;
  course: string;
  focus: string;
  level: LearningLevel;
  explanation_style: ExplanationStyle;
  goals: LearningGoal[] | null;
  mascot_color?: string | null;
  last_chat_at?: string | null;
  created_at: string;
  updated_at: string;
};

const GOALS = new Set<LearningGoal>(["pass_exam", "understand_basics", "practise_problems", "revise_fast"]);

export function normalizeTutor(tutor: Tutor): Tutor {
  return {
    ...tutor,
    mascotColor: normalizeMascotColor(tutor.mascotColor, tutor.course, tutor.id),
    lastChatAt: tutor.lastChatAt ?? null,
  };
}

function fromRow(row: TutorRow): Tutor {
  const goals = Array.isArray(row.goals) ? row.goals.filter((goal): goal is LearningGoal => GOALS.has(goal)) : [];
  return normalizeTutor({
    id: row.id,
    name: row.name,
    course: row.course,
    focus: row.focus,
    level: row.level,
    explanationStyle: row.explanation_style,
    goals,
    mascotColor: row.mascot_color ?? "",
    lastChatAt: row.last_chat_at ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  });
}

function toInsert(tutor: Tutor, userId: string) {
  return {
    id: tutor.id,
    user_id: userId,
    name: tutor.name,
    course: tutor.course,
    focus: tutor.focus,
    level: tutor.level,
    explanation_style: tutor.explanationStyle,
    goals: tutor.goals,
    mascot_color: tutor.mascotColor,
    created_at: tutor.createdAt,
    updated_at: tutor.updatedAt,
  };
}

async function supabaseTutors(owner: Owner) {
  if (owner.persisted !== "supabase" || !owner.supabase) return null;
  const { data, error } = await owner.supabase.from("tutors").select("*").order("updated_at", { ascending: false });
  if (error || !data) return null;
  return (data as TutorRow[]).map(fromRow);
}

export async function listTutors(owner: Owner) {
  const remote = await supabaseTutors(owner);
  if (remote) return remote;
  const bucket = await readBucket(owner.id);
  return bucket.tutors.map(normalizeTutor);
}

export async function getTutor(owner: Owner, id: string) {
  const tutors = await listTutors(owner);
  return tutors.find((tutor) => tutor.id === id) ?? null;
}

export async function createTutor(
  owner: Owner,
  input: Pick<Tutor, "name" | "course" | "focus" | "level" | "explanationStyle" | "goals">,
) {
  const now = new Date().toISOString();
  const id = crypto.randomUUID();
  const tutor: Tutor = {
    ...input,
    id,
    mascotColor: mascotColorFor(input.course, id),
    lastChatAt: null,
    createdAt: now,
    updatedAt: now,
  };
  const remote = await supabaseTutors(owner);
  if (remote) {
    if (!canCreateTutor(remote.length).ok) throw new TutorCapError();
    const { data, error } = await owner.supabase!.from("tutors").insert(toInsert(tutor, owner.id)).select("*").single();
    if (error && /cap/i.test(error.message)) throw new TutorCapError();
    if (error || !data) throw new Error("Could not save the tutor.");
    return fromRow(data as TutorRow);
  }
  return updateBucket(owner.id, (bucket) => {
    if (!canCreateTutor(bucket.tutors.length).ok) throw new TutorCapError();
    bucket.tutors.unshift(tutor);
    return normalizeTutor(tutor);
  });
}

export async function updateTutor(owner: Owner, id: string, patch: Partial<Omit<Tutor, "id" | "createdAt">>) {
  const now = new Date().toISOString();
  const remote = await supabaseTutors(owner);
  if (remote) {
    const current = remote.find((tutor) => tutor.id === id);
    if (!current) return null;
    const next = { ...current, ...patch, id, updatedAt: now };
    const { data, error } = await owner.supabase!
      .from("tutors")
      .update({
        name: next.name,
        course: next.course,
        focus: next.focus,
        level: next.level,
        explanation_style: next.explanationStyle,
        goals: next.goals,
        updated_at: now,
      })
      .eq("id", id)
      .select("*")
      .maybeSingle();
    if (error || !data) return null;
    return fromRow(data as TutorRow);
  }
  return updateBucket(owner.id, (bucket) => {
    const index = bucket.tutors.findIndex((tutor) => tutor.id === id);
    const current = bucket.tutors[index];
    if (!current) return null;
    const next = normalizeTutor({ ...current, ...patch, id, mascotColor: current.mascotColor, updatedAt: now });
    bucket.tutors[index] = next;
    return next;
  });
}

export async function deleteTutor(owner: Owner, id: string) {
  const remote = await supabaseTutors(owner);
  if (remote) {
    if (!remote.some((tutor) => tutor.id === id)) return false;
    const { error } = await owner.supabase!.from("tutors").delete().eq("id", id);
    return !error;
  }
  return updateBucket(owner.id, (bucket) => {
    const before = bucket.tutors.length;
    bucket.tutors = bucket.tutors.filter((tutor) => tutor.id !== id);
    if (bucket.threads) delete bucket.threads[id];
    return bucket.tutors.length < before;
  });
}

export { TUTOR_CAP };
