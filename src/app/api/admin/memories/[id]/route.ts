import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { authorize } from "@/lib/security";
import { memoryInput } from "@/lib/validation";
import { serializeMemory } from "@/lib/memories";
type Context = { params: Promise<{ id: string }> };
export async function PATCH(req: NextRequest, ctx: Context) {
  if (!(await authorize(req)))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  const existing = await db.memory.findUnique({ where: { id } });
  if (!existing)
    return NextResponse.json({ error: "Memory not found." }, { status: 404 });
  const body = await req.json().catch(() => null);
  const parsed = memoryInput.safeParse({
    ...serializeMemory(existing),
    ...body,
  });
  if (!parsed.success)
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 },
    );
  const updated = await db.memory.update({
    where: { id },
    data: { ...parsed.data, tags: JSON.stringify(parsed.data.tags) },
  });
  return NextResponse.json(serializeMemory(updated));
}
export async function DELETE(req: NextRequest, ctx: Context) {
  if (!(await authorize(req)))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await db.memory.deleteMany({ where: { id: (await ctx.params).id } });
  return NextResponse.json({ ok: true });
}
