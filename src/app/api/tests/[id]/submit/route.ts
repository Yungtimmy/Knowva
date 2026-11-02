import { NextResponse } from "next/server";
import { parseBody, readJson } from "@/lib/http";
import { resolveOwner } from "@/lib/owner";
import { testSubmitSchema } from "@/lib/schemas";
import { getPaper, submitPaper } from "@/lib/test-repo";
import { listTutors } from "@/lib/tutor-repo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const parsed = parseBody(testSubmitSchema, await readJson(request));
  if (!parsed.ok) return parsed.response;
  const owner = await resolveOwner();
  const paper = await getPaper(owner.id, id);
  if (!paper || paper.kind !== "test") return NextResponse.json({ error: "Test not found." }, { status: 404 });
  const tutors = await listTutors(owner);
  const result = await submitPaper(owner, id, parsed.data.answers, tutors);
  if (!result) return NextResponse.json({ error: "Test not found." }, { status: 404 });
  return NextResponse.json({ result });
}
