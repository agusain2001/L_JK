import { NextResponse } from "next/server";
import { publicMemories } from "@/lib/memories";
export const dynamic = "force-dynamic";
export async function GET() {
  return NextResponse.json(await publicMemories(), {
    headers: {
      "Cache-Control": "public, max-age=30, stale-while-revalidate=60",
    },
  });
}
