import { presentProfile, type PresentedProfile } from "./profile";
import { createClient } from "./supabase/server";

const blank: PresentedProfile = {
  displayName: "",
  username: "",
  age: null,
  interests: [],
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
  return presentProfile(row, { email: user.email, user_metadata: user.user_metadata });
}
