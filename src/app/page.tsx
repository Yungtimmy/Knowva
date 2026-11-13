import { FaqSection } from "@/components/site/FaqSection";
import { SiteFooter } from "@/components/site/SiteFooter";
import styles from "@/components/site/site.module.css";
import { LandingPage } from "./landing-page";

export default function HomePage() {
  return (
    <div className={styles.page}>
      <LandingPage />
      <FaqSection />
      <SiteFooter />
    </div>
  );
}
