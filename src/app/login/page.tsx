"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [role, setRole] = useState<"student" | "teacher">("student");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const configured = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY),
  );

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setMessage("");
    const supabase = createClient();
    if (!supabase) {
      setError("Add Supabase URL and anon key to .env.local. You can still use the demo without an account.");
      return;
    }
    if (mode === "up") {
      const { error: signError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { display_name: displayName } },
      });
      if (signError) {
        setError(signError.message);
        return;
      }
      if (role === "teacher") {
        const response = await fetch("/api/auth/role", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ role, displayName }),
        });
        const data = (await response.json()) as { error?: string; role?: string };
        if (!response.ok) {
          setMessage(data.error || "Account created as a student.");
          return;
        }
      }
      setMessage("Account created. If email confirmation is on, check your inbox before signing in.");
      return;
    }
    const { error: signError } = await supabase.auth.signInWithPassword({ email, password });
    if (signError) {
      setError(signError.message);
      return;
    }
    setMessage("Signed in. Open the student or teacher desk.");
  }

  return (
    <main className="gate">
      <Link href="/">Knowva</Link>
      <h1>{mode === "in" ? "Sign in" : "Create an account"}</h1>
      <p>Students and teachers use the same sign-in. The demo desks work without an account.</p>
      {!configured ? <p className="error">Supabase env is empty, so this form cannot create a session yet.</p> : null}
      <form onSubmit={onSubmit}>
        {mode === "up" ? (
          <>
            <label>
              Name
              <input value={displayName} onChange={(event) => setDisplayName(event.target.value)} required />
            </label>
            <label>
              Role
              <select value={role} onChange={(event) => setRole(event.target.value as "student" | "teacher")}>
                <option value="student">Student</option>
                <option value="teacher">Teacher</option>
              </select>
            </label>
          </>
        ) : null}
        <label>
          Email
          <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
        </label>
        <label>
          Password
          <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} minLength={8} required />
        </label>
        <button className="primary" type="submit">
          {mode === "in" ? "Sign in" : "Create account"}
        </button>
        {error ? <p className="error">{error}</p> : null}
        {message ? <p>{message}</p> : null}
      </form>
      <p style={{ marginTop: 16 }}>
        <button className="ghost" type="button" onClick={() => setMode(mode === "in" ? "up" : "in")}>
          {mode === "in" ? "Need an account?" : "Have an account?"}
        </button>
      </p>
      <p style={{ marginTop: 12 }}>
        <Link href="/student">Continue as Ada</Link>
        {" · "}
        <Link href="/teacher">Continue as Dr. Adeyemi</Link>
      </p>
    </main>
  );
}
