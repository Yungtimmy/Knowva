import { cookies } from "next/headers";
import { createClient } from "./supabase/server";

const COOKIE = "knowva_session";

export async function resolveOwner() {
  const supabase = await createClient();
  if (supabase) {
    try {
      const { data } = await supabase.auth.getUser();
      if (data.user) {
        return { id: data.user.id, supabase, persisted: "supabase" as const };
      }
    } catch {
      // Fall through to the session store.
    }
  }
  const jar = await cookies();
  let id = jar.get(COOKIE)?.value;
  if (!id || !/^[0-9a-f-]{36}$/i.test(id)) {
    id = crypto.randomUUID();
    jar.set(COOKIE, id, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 30 });
  }
  return { id: `session:${id}`, supabase: null, persisted: "session" as const };
}
