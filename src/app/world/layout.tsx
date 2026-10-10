import WorldShell from "@/components/world/WorldShell";
import { worldData } from "@/lib/world/repository";
import "./world.css";
export const dynamic = "force-dynamic";
export default async function WorldLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <WorldShell initial={await worldData()}>{children}</WorldShell>;
}
