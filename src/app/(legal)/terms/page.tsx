import type { Metadata } from "next";
import { LegalDocument } from "@/components/site/LegalDocument";
import { termsPage } from "@/lib/site-copy";

export const metadata: Metadata = {
  title: termsPage.title,
  description: termsPage.description,
};

export default function TermsPage() {
  return <LegalDocument page={termsPage} />;
}
