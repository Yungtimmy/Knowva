import { redirect } from "next/navigation";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const params = await searchParams;
  const query = new URLSearchParams({ mode: "signup" });
  if (params.next) query.set("next", params.next);
  if (params.error) query.set("error", params.error);
  redirect(`/login?${query.toString()}`);
}
