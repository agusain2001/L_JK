import { NextRequest, NextResponse } from "next/server";
import { authorize } from "@/lib/security";
import { syncApify } from "@/lib/apify";
import { z } from "zod";
export const maxDuration = 90;
export async function POST(req: NextRequest) {
  if (!(await authorize(req)))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = z
    .object({ mode: z.enum(["dataset", "task", "actor"]) })
    .safeParse(await req.json().catch(() => null));
  if (!body.success)
    return NextResponse.json(
      { error: "Choose dataset, task, or actor." },
      { status: 400 },
    );
  try {
    return NextResponse.json(await syncApify(body.data.mode));
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message.replace(/apify_api_[\w]+/g, "[redacted]")
            : "Synchronization failed.",
      },
      { status: 502 },
    );
  }
}
