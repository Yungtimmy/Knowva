import { redirect } from "next/navigation";
import { OnboardingForm } from "./onboarding-form";
import { loadStudentProfile } from "@/lib/profile-server";

export default async function OnboardingPage() {
  const profile = await loadStudentProfile();
  if (profile.complete) redirect("/student");
  return <OnboardingForm suggestedName={profile.suggestedName} />;
}
