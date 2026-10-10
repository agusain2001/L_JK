import { worldData } from "@/lib/world/repository";
export const dynamic = "force-dynamic";
export async function GET() {
  return Response.json(await worldData(), {
    headers: { "Cache-Control": "private, no-store" },
  });
}
