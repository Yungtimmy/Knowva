import { NextResponse } from "next/server";
import { resolveOwner } from "@/lib/owner";
import { getPaper } from "@/lib/test-repo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const owner = await resolveOwner();
  const paper = await getPaper(owner.id, id);
  if (!paper || paper.kind !== "test") return NextResponse.json({ error: "Test not found." }, { status: 404 });
  if (!paper.result) {
    return NextResponse.json({ error: "Submit the test before opening results." }, { status: 409 });
  }
  return NextResponse.json({ result: paper.result });
}
