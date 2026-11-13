import { FaqSection } from "@/components/site/FaqSection";
import { SiteFooter } from "@/components/site/SiteFooter";
import { LandingPage } from "./landing-page";

export default function HomePage() {
  return (
    <>
      <LandingPage />
      <FaqSection />
      <SiteFooter />
    </>
  );
}
