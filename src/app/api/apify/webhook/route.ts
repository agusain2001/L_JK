import { NextRequest, NextResponse } from "next/server";
import { equal } from "@/lib/security";
import { syncApify } from "@/lib/apify";
import { z } from "zod";
export async function POST(req: NextRequest) {
  const secret = process.env.APIFY_WEBHOOK_SECRET;
  if (
    !secret ||
    !equal(req.headers.get("authorization") || "", `Bearer ${secret}`)
  )
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = z
    .object({
      eventType: z.literal("ACTOR.RUN.SUCCEEDED"),
      resource: z.object({ defaultDatasetId: z.string().min(1).max(100) }),
    })
    .safeParse(await req.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json({ error: "Unsupported event." }, { status: 400 });
  try {
    return NextResponse.json(
      await syncApify("dataset", parsed.data.resource.defaultDatasetId),
    );
  } catch {
    return NextResponse.json(
      { error: "Sync failed. Retry from the administration page." },
      { status: 502 },
    );
  }
}
