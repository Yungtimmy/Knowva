import { NextResponse } from "next/server";
import { resolveOwner } from "@/lib/owner";
import { listMaterials } from "@/lib/test-repo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const owner = await resolveOwner();
  const materials = await listMaterials(owner.id);
  return NextResponse.json({ materials, persisted: owner.persisted });
}
