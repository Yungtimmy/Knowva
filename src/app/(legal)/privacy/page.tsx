import type { Metadata } from "next";
import { LegalDocument } from "@/components/site/LegalDocument";
import { privacyPage } from "@/lib/site-copy";

export const metadata: Metadata = {
  title: privacyPage.title,
  description: privacyPage.description,
};

export default function PrivacyPage() {
  return <LegalDocument page={privacyPage} />;
}
