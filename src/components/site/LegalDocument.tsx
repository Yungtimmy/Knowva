import type { LegalPageCopy } from "@/lib/site-copy";
import { Inline } from "./Inline";
import styles from "./site.module.css";

export function LegalDocument({ page }: { page: LegalPageCopy }) {
  return (
    <article className={styles.legal}>
      <div className={styles.wrap}>
        <span className={styles.eyebrow}>{page.eyebrow}</span>
        <h1>{page.title}</h1>
        <p className={styles.updated}>{page.updated}</p>
        {page.sections.map((section) => (
          <section key={section.id} aria-labelledby={section.id}>
            <h2 id={section.id}>{section.heading}</h2>
            {section.paragraphs.map((paragraph, index) => (
              <p key={index}>
                <Inline parts={paragraph} />
              </p>
            ))}
          </section>
        ))}
      </div>
    </article>
  );
}
