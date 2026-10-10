import { notFound } from "next/navigation";
import { featureIds, type FeatureId } from "@/lib/world/schemas";
import WorldExperience from "@/components/world/WorldExperience";
export default async function FeaturePage({
  params,
}: {
  params: Promise<{ feature: string }>;
}) {
  const { feature } = await params;
  if (!featureIds.includes(feature as FeatureId)) notFound();
  return <WorldExperience id={feature as FeatureId} />;
}
