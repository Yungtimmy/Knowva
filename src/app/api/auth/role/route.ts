import { NextResponse } from "next/server";
import { parseBody, readJson } from "@/lib/http";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

export const runtime = "nodejs";

const bodySchema = z.object({
  role: z.enum(["student", "teacher"]),
  displayName: z.string().trim().min(1).max(80).optional(),
});

export async function POST(request: Request) {
  const parsed = parseBody(bodySchema, await readJson(request));
  if (!parsed.ok) return parsed.response;

  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json(
      { error: "Supabase is not configured." },
      { status: 503 },
    );
  }

  const { data } = await supabase.auth.getUser();
  if (!data.user) {
    return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  }

  if (parsed.data.displayName) {
    await supabase.from("profiles").update({ display_name: parsed.data.displayName }).eq("id", data.user.id);
  }

  return NextResponse.json({ role: "student" });
}
