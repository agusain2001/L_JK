import RecipientAccess from "@/components/world/RecipientAccess";
export default async function AccessPage({
  searchParams,
}: {
  searchParams: Promise<{ invite?: string }>;
}) {
  return <RecipientAccess token={(await searchParams).invite || ""} />;
}
