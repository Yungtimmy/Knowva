import { NextResponse } from "next/server";
import { resolveOwner } from "@/lib/owner";
import { getPaper, TestStoreError } from "@/lib/test-repo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  try {
    const owner = await resolveOwner();
    const paper = await getPaper(owner, id);
    if (!paper || paper.kind !== "test") return NextResponse.json({ error: "Test not found." }, { status: 404 });
    if (!paper.result) {
      return NextResponse.json({ error: "Submit the test before opening results." }, { status: 409 });
    }
    return NextResponse.json({ result: paper.result });
  } catch (error) {
    if (error instanceof TestStoreError) return NextResponse.json({ error: error.message }, { status: 500 });
    console.error("GET /api/tests/[id]/results", error instanceof Error ? error.name : "error");
    return NextResponse.json({ error: "Could not open those results." }, { status: 500 });
  }
}
