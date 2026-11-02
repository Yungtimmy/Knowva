import { createClient } from "./supabase/server";

export async function saveQuizAttempt(row: {
  quizId: string;
  subject: string;
  topic: string;
  score: number;
  total: number;
  missed: number[];
}) {
  const supabase = await createClient();
  if (!supabase) return;
  try {
    const { data } = await supabase.auth.getUser();
    if (!data.user) return;
    await supabase.from("quiz_attempts").insert({
      user_id: data.user.id,
      quiz_id: row.quizId,
      subject: row.subject,
      topic: row.topic,
      score: row.score,
      total: row.total,
      missed: row.missed,
    });
  } catch {
    // Scoring still returns. Storage is best-effort until a project is linked.
  }
}

export async function saveMaterial(row: {
  kind: "study_pack" | "lesson" | "quiz" | "marking_guide";
  title: string;
  subject: string;
  topic: string;
  payload: unknown;
}) {
  const supabase = await createClient();
  if (!supabase) return;
  try {
    const { data } = await supabase.auth.getUser();
    if (!data.user) return;
    await supabase.from("saved_materials").insert({
      user_id: data.user.id,
      kind: row.kind,
      title: row.title,
      subject: row.subject,
      topic: row.topic,
      payload: row.payload,
    });
  } catch {
    // The draft is still returned to the page.
  }
}
