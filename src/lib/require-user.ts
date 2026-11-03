import { redirect } from "next/navigation";
import { createClient } from "./supabase/server";

export async function requireSignedIn() {
  const supabase = await createClient();
  if (!supabase) redirect("/login");
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (!claims?.sub || claims.is_anonymous === true) redirect("/login");
}
