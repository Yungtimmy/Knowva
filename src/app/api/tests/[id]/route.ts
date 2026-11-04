import { NextResponse } from "next/server";
import { resolveOwner } from "@/lib/owner";
import { getPaper, TestStoreError, toPaper } from "@/lib/test-repo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  try {
    const owner = await resolveOwner();
    const paper = await getPaper(owner, id);
    if (!paper || paper.kind !== "test") return NextResponse.json({ error: "Test not found." }, { status: 404 });
    return NextResponse.json({ test: toPaper(paper) });
  } catch (error) {
    if (error instanceof TestStoreError) return NextResponse.json({ error: error.message }, { status: 500 });
    console.error("GET /api/tests/[id]", error instanceof Error ? error.name : "error");
    return NextResponse.json({ error: "Could not open that test." }, { status: 500 });
  }
}
