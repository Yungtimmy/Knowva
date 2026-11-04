import { NextResponse } from "next/server";
import type { ZodError, ZodType } from "zod";

export function invalidBody(error: ZodError) {
  return NextResponse.json(
    {
      error: "Check the fields and try again.",
      issues: error.issues.map((issue) => ({
        path: issue.path.join("."),
        message: issue.message,
      })),
    },
    { status: 400 },
  );
}

/** No model key: 503 plus a usable demo body. Callers treat `demo: true` as data. */
export function demoPayload(body: Record<string, unknown>) {
  return NextResponse.json(
    {
      demo: true,
      error: "LLM key is not configured. Showing a demo payload.",
      ...body,
    },
    { status: 503 },
  );
}

export function modelFailed(detail?: string) {
  const extra = detail?.replace(/\s+/g, " ").trim() ?? "";
  const safe = extra && !/key|bearer|token|authorization|secret/i.test(extra) ? extra.slice(0, 140) : "";
  return NextResponse.json(
    { error: safe ? `The model did not answer. ${safe}` : "The model did not answer. Try again in a moment." },
    { status: 502 },
  );
}

export async function readJson(request: Request) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

export function parseBody<T>(schema: ZodType<T>, body: unknown) {
  const parsed = schema.safeParse(body);
  if (!parsed.success) return { ok: false as const, response: invalidBody(parsed.error) };
  return { ok: true as const, data: parsed.data };
}
