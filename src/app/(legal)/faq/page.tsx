import type { Metadata } from "next";
import { FaqSection } from "@/components/site/FaqSection";
import { faqIntro } from "@/lib/site-copy";

export const metadata: Metadata = {
  title: "FAQ",
  description: faqIntro.lede,
};

export default function FaqPage() {
  return <FaqSection heading="h1" />;
}
