import { NextResponse } from "next/server";
import { parseBody, readJson } from "@/lib/http";
import { ResourceCurateError, curateResources } from "@/lib/resource-curate";
import { resourcesSchema } from "@/lib/schemas";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(request: Request) {
  const parsed = parseBody(resourcesSchema, await readJson(request));
  if (!parsed.ok) return parsed.response;
  const input = parsed.data;
  try {
    const resources = await curateResources({
      subject: input.subject,
      topic: input.topic,
      level: input.level ?? "intermediate",
      preference: input.preference,
      weakTopic: input.weakTopic,
    });
    const count = resources.primary.length + resources.alternates.length;
    return NextResponse.json({
      demo: false,
      resources,
      note: count === 0 ? "No checked links for that topic yet." : "",
    });
  } catch (error) {
    if (error instanceof ResourceCurateError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("POST /api/resources", error instanceof Error ? error.name : "error");
    return NextResponse.json({ error: "Could not find resources. Try again in a moment." }, { status: 502 });
  }
}
