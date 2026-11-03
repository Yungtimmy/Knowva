import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { safeNextPath } from "@/lib/safe-next";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const oauthError = searchParams.get("error_description") || searchParams.get("error");
  const jar = await cookies();
  const next = safeNextPath(searchParams.get("next")) || safeNextPath(jar.get("knowva_next")?.value);

  if (!code) {
    const message = oauthError || "Google sign-in did not finish.";
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(message)}`);
  }

  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent("Supabase is not configured.")}`);
  }

  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(error.message)}`);
  }

  const destination = next || (await homeFor(supabase));
  const response = NextResponse.redirect(`${origin}${destination}`);
  response.cookies.set("knowva_next", "", { path: "/", maxAge: 0 });
  return response;
}

async function homeFor(supabase: NonNullable<Awaited<ReturnType<typeof createClient>>>) {
  const { data } = await supabase.auth.getUser();
  if (!data.user) return "/student";
  const profile = await supabase.from("profiles").select("role").eq("id", data.user.id).maybeSingle();
  return profile.data?.role === "teacher" ? "/teacher" : "/student";
}
