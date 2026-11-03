import { PackScreen } from "@/components/student/PackScreen";
import { samplePack } from "@/lib/demo";

export default async function PackPage({ params }: { params: Promise<{ packId: string }> }) {
  const { packId } = await params;
  const fallback = packId === samplePack.id ? samplePack : null;
  return <PackScreen packId={packId} fallback={fallback} />;
}
