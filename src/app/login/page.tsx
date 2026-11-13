import { SiteFooter } from "@/components/site/SiteFooter";
import styles from "@/components/site/site.module.css";
import { safeNextPath } from "@/lib/safe-next";
import { LoginScreen } from "./login-screen";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string; next?: string; error?: string }>;
}) {
  const params = await searchParams;
  return (
    <div className={styles.page}>
      <LoginScreen
        initialMode={params.mode === "signup" ? "signup" : "signin"}
        initialNext={safeNextPath(params.next)}
        initialError={params.error ?? ""}
      />
      <SiteFooter />
    </div>
  );
}
