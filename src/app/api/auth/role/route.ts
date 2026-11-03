import { createClient as createAdmin } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { parseBody, readJson } from "@/lib/http";
import { createClient } from "@/lib/supabase/server";
import { supabasePublicEnv, supabaseSecretKey } from "@/lib/supabase/env";
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

  if (parsed.data.role !== "teacher") {
    return NextResponse.json({ role: "student" });
  }

  const env = supabasePublicEnv();
  const serviceKey = supabaseSecretKey() ?? null;
  if (!env || !serviceKey) {
    return NextResponse.json(
      {
        role: "student",
        error: "This account stays a student until a server secret key and the project URL are set.",
      },
      { status: 409 },
    );
  }

  const admin = createAdmin(env.url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { error } = await admin.from("profiles").update({ role: "teacher" }).eq("id", data.user.id);
  if (error) {
    return NextResponse.json({ error: "Could not set the teacher role." }, { status: 502 });
  }
  return NextResponse.json({ role: "teacher" });
}
