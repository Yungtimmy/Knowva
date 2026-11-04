import { NextResponse } from "next/server";
import { parseBody, readJson } from "@/lib/http";
import { resolveOwner } from "@/lib/owner";
import { testSubmitSchema } from "@/lib/schemas";
import { getPaper, submitPaper, TestStoreError } from "@/lib/test-repo";
import { listTutors } from "@/lib/tutor-repo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const parsed = parseBody(testSubmitSchema, await readJson(request));
  if (!parsed.ok) return parsed.response;
  try {
    const owner = await resolveOwner();
    const paper = await getPaper(owner, id);
    if (!paper || paper.kind !== "test") return NextResponse.json({ error: "Test not found." }, { status: 404 });
    const tutors = await listTutors(owner);
    const result = await submitPaper(owner, id, parsed.data.answers, tutors);
    if (!result) return NextResponse.json({ error: "Test not found." }, { status: 404 });
    return NextResponse.json({ result });
  } catch (error) {
    if (error instanceof TestStoreError) return NextResponse.json({ error: error.message }, { status: 500 });
    console.error("POST /api/tests/[id]/submit", error instanceof Error ? error.name : "error");
    return NextResponse.json({ error: "Could not score that test." }, { status: 500 });
  }
}
