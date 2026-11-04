import { NextResponse } from "next/server";
import { COURSE_SET } from "@/lib/courses";
import { parseBody, readJson } from "@/lib/http";
import { loadStudentProfile } from "@/lib/profile-server";
import { profileSchema } from "@/lib/schemas";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  const { data } = await supabase.auth.getUser();
  if (!data.user) return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  const profile = await loadStudentProfile();
  return NextResponse.json({ profile });
}

export async function PATCH(request: Request) {
  const parsed = parseBody(profileSchema, await readJson(request));
  if (!parsed.ok) return parsed.response;
  const input = parsed.data;
  if (input.interests.some((item) => !COURSE_SET.has(item))) {
    return NextResponse.json({ error: "Pick a course from the list." }, { status: 400 });
  }
  const interests = [...new Set(input.interests)];

  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  const { data } = await supabase.auth.getUser();
  if (!data.user) return NextResponse.json({ error: "Sign in first." }, { status: 401 });

  const patch = {
    display_name: input.displayName,
    username: input.username,
    age: input.age,
    interests,
  };
  const updated = await supabase.from("profiles").update(patch).eq("id", data.user.id).select("id").maybeSingle();
  if (updated.error) return profileError(updated.error.code, updated.error.message);
  if (!updated.data) {
    const inserted = await supabase.from("profiles").insert({ id: data.user.id, ...patch }).select("id").maybeSingle();
    if (inserted.error) return profileError(inserted.error.code, inserted.error.message);
  }

  const profile = await loadStudentProfile();
  return NextResponse.json({ profile });
}

function profileError(code: string | undefined, message: string) {
  console.error("profile write", code ?? "error");
  if (code === "23505" || /duplicate|unique/i.test(message)) {
    return NextResponse.json({ error: "That username is taken." }, { status: 409 });
  }
  if (code === "42703" || /column/i.test(message)) {
    return NextResponse.json({ error: "Profile storage is not ready yet." }, { status: 500 });
  }
  return NextResponse.json({ error: "Could not save your profile." }, { status: 500 });
}
