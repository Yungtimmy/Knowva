import { demoPayload, parseBody, readJson } from "@/lib/http";
import { llmConfigured } from "@/lib/llm";
import { recommend } from "@/lib/recommend";
import { recommendSchema } from "@/lib/schemas";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const parsed = parseBody(recommendSchema, await readJson(request));
  if (!parsed.ok) return parsed.response;
  const recommendation = recommend(parsed.data);
  if (!llmConfigured()) return demoPayload({ recommendation });
  return Response.json({ demo: false, recommendation });
}
