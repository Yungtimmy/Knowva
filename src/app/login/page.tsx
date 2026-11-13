import { SiteFooter } from "@/components/site/SiteFooter";
import { safeNextPath } from "@/lib/safe-next";
import { LoginScreen } from "./login-screen";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string; next?: string; error?: string }>;
}) {
  const params = await searchParams;
  return (
    <>
      <LoginScreen
        initialMode={params.mode === "signup" ? "signup" : "signin"}
        initialNext={safeNextPath(params.next)}
        initialError={params.error ?? ""}
      />
      <SiteFooter />
    </>
  );
}
