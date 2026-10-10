import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { authorize } from "@/lib/security";
import { serializeMemory } from "@/lib/memories";
import { memoryInput } from "@/lib/validation";
export async function GET(req: NextRequest) {
  if (!(await authorize(req)))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json(
    (await db.memory.findMany({ orderBy: { order: "asc" } })).map(
      serializeMemory,
    ),
  );
}
export async function POST(req: NextRequest) {
  if (!(await authorize(req)))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = memoryInput.safeParse(await req.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 },
    );
  try {
    const m = await db.memory.create({
      data: {
        ...parsed.data,
        approved: false,
        tags: JSON.stringify(parsed.data.tags),
      },
    });
    return NextResponse.json(serializeMemory(m));
  } catch {
    return NextResponse.json(
      { error: "This media URL already exists." },
      { status: 409 },
    );
  }
}
