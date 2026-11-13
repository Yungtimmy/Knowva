import Link from "next/link";
import { PATH } from "@/lib/site";
import { footerCopy } from "@/lib/site-copy";
import styles from "./site.module.css";

export function SiteFooter() {
  return (
    <footer className={styles.footer}>
      <div className={styles.wrap}>
        <div className={styles.top}>
          <div className={styles.brand}>
            <Link className={styles.logo} href={PATH.home}>
              {footerCopy.wordmark}
              <span>.</span>
            </Link>
            <p className={styles.tag}>{footerCopy.tagline}</p>
            <Link className={styles.cta} href={footerCopy.ctaHref}>
              {footerCopy.cta}
            </Link>
          </div>
          <nav className={styles.col} aria-label={footerCopy.productTitle}>
            <h2 className={styles.colTitle}>{footerCopy.productTitle}</h2>
            {footerCopy.product.map((item) => (
              <Link key={item.href} href={item.href}>
                {item.label}
              </Link>
            ))}
          </nav>
          <nav className={styles.col} aria-label={footerCopy.helpTitle}>
            <h2 className={styles.colTitle}>{footerCopy.helpTitle}</h2>
            {footerCopy.help.map((item) => (
              <Link key={item.href} href={item.href}>
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className={styles.bottom}>
          <span>{footerCopy.copyright}</span>
          <span>
            {footerCopy.legal.map((item) => (
              <Link key={item.label} href={item.href}>
                {item.label}
              </Link>
            ))}
          </span>
        </div>
      </div>
    </footer>
  );
}
