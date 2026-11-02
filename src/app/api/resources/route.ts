import { NextResponse } from "next/server";
import { parseBody, readJson } from "@/lib/http";
import { assembleResources, verifyBundle } from "@/lib/resources";
import { resourcesSchema } from "@/lib/schemas";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const parsed = parseBody(resourcesSchema, await readJson(request));
  if (!parsed.ok) return parsed.response;
  const input = parsed.data;
  const drafted = assembleResources({
    subject: input.subject,
    topic: input.topic,
    level: input.level ?? "intermediate",
    preference: input.preference,
    weakTopic: input.weakTopic,
  });
  const resources = await verifyBundle(drafted);
  return NextResponse.json({
    demo: false,
    resources,
    note: "Links are curated. verified is true only after a reachability check. Search queries are not checked links.",
  });
}
