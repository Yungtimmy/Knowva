"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AuthFloats, KnowvaClouds } from "@/components/KnowvaClouds";
import { safeNextPath } from "@/lib/safe-next";
import { createClient } from "@/lib/supabase/client";

function rememberNext(next: string) {
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  const value = next ? encodeURIComponent(next) : "";
  const maxAge = next ? 600 : 0;
  document.cookie = `knowva_next=${value}; Path=/; Max-Age=${maxAge}; SameSite=Lax${secure}`;
}

export function LoginScreen({
  initialMode,
  initialNext,
  initialError,
}: {
  initialMode: "signin" | "signup";
  initialNext: string;
  initialError: string;
}) {
  const [error, setError] = useState(initialError);
  const [mode, setMode] = useState(initialMode);
  const [next, setNext] = useState(initialNext);
  const [busy, setBusy] = useState(false);
  const configured = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY),
  );

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const currentMode = params.get("mode") === "signup" ? "signup" : "signin";
    const currentNext = safeNextPath(params.get("next"));
    const currentError = params.get("error") ?? "";
    setMode(currentMode);
    setNext(currentNext);
    if (currentError) setError(currentError);
    rememberNext(currentNext);
  }, []);

  async function continueWithGoogle() {
    setError("");
    const params = new URLSearchParams(window.location.search);
    const currentNext = safeNextPath(params.get("next"));
    rememberNext(currentNext);
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
        ? `/signup?next=${encodeURIComponent(next)}`
        : "/signup";

  return (
    <div className="auth-screen">
      <AuthFloats />
      <main className="auth-card">
        <KnowvaClouds size="auth" />
        <Link className="logo" href="/">
          Knowva
        </Link>
        <h1>{mode === "signup" ? "Meet your AI tutors" : "Welcome back"}</h1>
        <p className="sub">{mode === "signup" ? "Create your free account in one tap." : "Pick up where your tutors left off."}</p>
        {!configured ? <p className="error">Supabase env is empty, so Google sign-in cannot start yet.</p> : null}
        <button className="google" type="button" onClick={() => void continueWithGoogle()} disabled={busy || !configured} aria-busy={busy}>
          <GoogleMark />
          {busy ? "Opening Google" : "Continue with Google"}
        </button>
        {error ? <p className="error">{error}</p> : null}
        <p className="swap">
          {mode === "signup" ? (
            <>
              Already have an account? <Link className="mode-link" href={otherHref}>Sign in</Link>
            </>
          ) : (
            <>
              New to Knowva? <Link className="mode-link" href={otherHref}>Create an account</Link>
            </>
          )}
        </p>
        <p className="fine">
          By continuing you agree to our <Link href="/terms">Terms</Link> and <Link href="/privacy">Privacy Policy</Link>.
        </p>
      </main>
    </div>
  );
}

function GoogleMark() {
  return (
    <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  );
}
