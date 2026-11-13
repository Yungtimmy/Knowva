import Link from "next/link";
import { SiteFooter } from "@/components/site/SiteFooter";
import styles from "@/components/site/site.module.css";
import { PATH } from "@/lib/site";

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={styles.page}>
      <header className={styles.wordmarkBar}>
        <div className={styles.wrap}>
          <Link className={styles.home} href={PATH.home}>
            Knowva
          </Link>
        </div>
      </header>
      {children}
      <SiteFooter />
    </div>
  );
}
