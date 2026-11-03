"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { safeNextPath } from "@/lib/safe-next";
import { createClient } from "@/lib/supabase/client";

function intent() {
  const params = new URLSearchParams(window.location.search);
  return {
    error: params.get("error") ?? "",
    mode: params.get("mode") === "signup" ? ("signup" as const) : ("signin" as const),
    next: safeNextPath(params.get("next")),
  };
}

function rememberNext(next: string) {
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  const value = next ? encodeURIComponent(next) : "";
  const maxAge = next ? 600 : 0;
  document.cookie = `knowva_next=${value}; Path=/; Max-Age=${maxAge}; SameSite=Lax${secure}`;
}

export default function LoginPage() {
  const [error, setError] = useState("");
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [next, setNext] = useState("");
  const [busy, setBusy] = useState(false);
  const configured = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY),
  );

  useEffect(() => {
    const current = intent();
    setMode(current.mode);
    setNext(current.next);
    if (current.error) setError(current.error);
    rememberNext(current.next);
  }, []);

  async function continueWithGoogle() {
    setError("");
    const current = intent();
    rememberNext(current.next);
    const supabase = createClient();
    if (!supabase) {
      setError("Supabase is not configured on this server.");
      return;
    }
    setBusy(true);
    const { error: signError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (signError) {
      setBusy(false);
      setError(signError.message);
    }
  }

  const otherHref =
    mode === "signup"
      ? next
        ? `/login?next=${encodeURIComponent(next)}`
        : "/login"
      : next
        ? `/login?mode=signup&next=${encodeURIComponent(next)}`
        : "/login?mode=signup";

  return (
    <main className="gate">
      <Link href="/">Knowva</Link>
      <h1>{mode === "signup" ? "Sign up" : "Sign in"}</h1>
      <p>
        Google is the only way in. The first visit creates your profile. The next visit opens the same one.
      </p>
      {!configured ? <p className="error">Supabase env is empty, so Google sign-in cannot start yet.</p> : null}
      <button className="google" type="button" onClick={() => void continueWithGoogle()} disabled={busy || !configured}>
        <GoogleMark />
        {busy ? "Opening Google" : "Continue with Google"}
      </button>
      {error ? <p className="error">{error}</p> : null}
      <p style={{ marginTop: 28 }}>
        <Link href={otherHref}>{mode === "signup" ? "Already have an account? Sign in" : "New to Knowva? Sign up"}</Link>
      </p>
    </main>
  );
}

function GoogleMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 8 3.1l5.7-5.7C34.2 6.1 29.4 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.2-.1-2.3-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 12 24 12c3.1 0 5.8 1.2 8 3.1l5.7-5.7C34.2 6.1 29.4 4 24 4 16.3 4 9.6 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 10-2 13.6-5.2l-6.3-5.3C29.2 35.1 26.7 36 24 36c-5.3 0-9.7-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-1.1 3.2-3.5 5.7-6.6 7.1l6.3 5.3C37.4 38.4 44 33 44 24c0-1.2-.1-2.3-.4-3.5z" />
    </svg>
  );
}
