import { demoPayload, parseBody, readJson } from "@/lib/http";
import { llmConfigured } from "@/lib/llm";
import { recommend } from "@/lib/recommend";
import { assembleResources, verifyBundle } from "@/lib/resources";
import { recommendSchema } from "@/lib/schemas";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const parsed = parseBody(recommendSchema, await readJson(request));
  if (!parsed.ok) return parsed.response;
  const recommendation = recommend(parsed.data);
  const resources = parsed.data.preference
    ? await verifyBundle(
        assembleResources({
          subject: parsed.data.subject,
          topic: parsed.data.weakTopic || parsed.data.topic,
          level: parsed.data.level ?? "intermediate",
          preference: parsed.data.preference,
          weakTopic: parsed.data.weakTopic,
        }),
      )
    : null;
  const body = { recommendation, resources };
  if (!llmConfigured()) return demoPayload(body);
  return Response.json({ demo: false, ...body });
}
