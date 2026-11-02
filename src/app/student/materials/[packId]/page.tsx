import { PackScreen } from "@/components/student/PackScreen";
import { cellPack } from "@/lib/demo";

export default async function PackPage({ params }: { params: Promise<{ packId: string }> }) {
  const { packId } = await params;
  const fallback = packId === cellPack.id ? cellPack : null;
  return <PackScreen packId={packId} fallback={fallback} />;
}
