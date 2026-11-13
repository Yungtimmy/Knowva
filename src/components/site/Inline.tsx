import Link from "next/link";
import type { InlinePart } from "@/lib/site-copy";

export function Inline({ parts }: { parts: InlinePart[] }) {
  return parts.map((part, index) =>
    typeof part === "string" ? (
      <span key={index}>{part}</span>
    ) : (
      <Link key={index} href={part.href}>
        {part.label}
      </Link>
    ),
  );
}
