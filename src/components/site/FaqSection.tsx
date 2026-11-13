import Link from "next/link";
import { FAQ, faqIntro } from "@/lib/site-copy";
import { Inline } from "./Inline";
import styles from "./site.module.css";

export function FaqSection({ heading = "h2", standalone = false }: { heading?: "h1" | "h2"; standalone?: boolean }) {
  const Title = heading;
  return (
    <section className={standalone ? `${styles.faq} ${styles.faqStandalone}` : styles.faq} id="faq" aria-labelledby="faq-title">
      <div className={`${styles.wrap} ${styles.grid}`}>
        <div className={styles.side}>
          <span className={styles.eyebrow}>{faqIntro.eyebrow}</span>
          <Title id="faq-title">
            {faqIntro.title[0]}
            <br />
            {faqIntro.title[1]}
          </Title>
          <p className={styles.lede}>{faqIntro.lede}</p>
          <Link className={styles.ask} href={faqIntro.ctaHref}>
            {faqIntro.cta}
          </Link>
        </div>
        <div className={styles.list}>
          {FAQ.map((item) => (
            <details key={item.id} className={styles.item} {...(item.startOpen ? { open: true } : {})}>
              <summary className={styles.summary}>
                {item.question}
                <span className={styles.pm} aria-hidden="true">
                  +
                </span>
              </summary>
              {item.paragraphs.map((paragraph, index) => (
                <p key={index} className={styles.answer}>
                  <Inline parts={paragraph} />
                </p>
              ))}
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
