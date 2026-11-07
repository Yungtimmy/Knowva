import { presentProfile, type PresentedProfile } from "./profile";
import { createClient } from "./supabase/server";

const blank: PresentedProfile = {
  displayName: "",
  username: "",
  age: null,
  interests: [],
  avatarUrl: "",
  complete: false,
  greetingName: "there",
  suggestedName: "",
  initials: "·",
};

export async function loadStudentProfile(): Promise<PresentedProfile> {
  const supabase = await createClient();
  if (!supabase) return blank;
  const { data } = await supabase.auth.getUser();
  const user = data.user;
  if (!user) return blank;
  const { data: row, error } = await supabase
    .from("profiles")
    .select("display_name, username, age, interests")
    .eq("id", user.id)
    .maybeSingle();
  if (error) console.error("profile read", error.code);
  // The avatar column ships in its own migration, so read it in a way that
  // still leaves the rest of the profile usable before it is applied.
  const { data: avatar, error: avatarError } = await supabase
    .from("profiles")
    .select("avatar_url")
    .eq("id", user.id)
    .maybeSingle();
  if (avatarError) console.error("avatar read", avatarError.code);
  return presentProfile(row ? { ...row, avatar_url: avatar?.avatar_url ?? null } : row, {
    email: user.email,
    user_metadata: user.user_metadata,
  });
}
