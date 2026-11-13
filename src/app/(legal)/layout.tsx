import { SiteFooter } from "@/components/site/SiteFooter";

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <SiteFooter />
    </>
  );
}
