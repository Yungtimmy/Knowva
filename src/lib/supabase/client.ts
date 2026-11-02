"use client";

import { createBrowserClient } from "@supabase/ssr";
import { supabasePublicEnv } from "./env";

export function createClient() {
  const env = supabasePublicEnv();
  if (!env) return null;
  return createBrowserClient(env.url, env.key);
}
