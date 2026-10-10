import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { actor } from "@/lib/world/auth";
import { sameOrigin } from "@/lib/security";
import { bucketSchema } from "@/lib/world/schemas";
import { validateReferences, worldSettings } from "@/lib/world/repository";
export async function GET() {
  const who = await actor();
  const { flags } = await worldSettings();
  if (!who || flags["bucket-list"] === false)
    return NextResponse.json(
      { error: "Sign in to your shared notebook." },
      { status: 401 },
    );
  return NextResponse.json(
    await db.bucketListItem.findMany({
      orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    }),
  );
}
export async function POST(req: NextRequest) {
  const who = await actor();
  const { flags, settings } = await worldSettings();
  if (
    !who ||
    !sameOrigin(req, true) ||
    flags["bucket-list"] === false ||
    (who.role !== "owner" && !settings.sharedBucket)
  )
    return NextResponse.json(
      { error: "Shared editing is not available." },
      { status: 403 },
    );
  try {
    const input = await req.json();
    if (input?.action === "reorder") {
      const ids = z.array(z.string().min(1)).max(500).parse(input.ids);
      const existing = await db.bucketListItem.findMany({
        select: { id: true },
      });
      if (
        new Set(ids).size !== ids.length ||
        existing.length !== ids.length ||
        existing.some((row) => !ids.includes(row.id))
      )
        throw new Error("Refresh the notebook before reordering.");
      await db.$transaction(
        ids.map((id, order) =>
          db.bucketListItem.update({ where: { id }, data: { order } }),
        ),
      );
      return NextResponse.json({ ok: true });
    }
    const { id, ...data } = bucketSchema.parse(input);
    await validateReferences(data.memoryId ? [data.memoryId] : [], [], who);
    const saved = await db.$transaction(async (tx) => {
      const item = id
        ? await tx.bucketListItem.update({ where: { id }, data })
        : await tx.bucketListItem.create({
            data: { ...data, creatorId: who.id },
          });
      if (item.completed) {
        await tx.gardenFlower.upsert({
          where: { eventKey: `bucket:${item.id}` },
          create: {
            eventKey: `bucket:${item.id}`,
            label: item.title,
            type: "tulip",
            color: "#e8a8ad",
            x: 20 + (item.order % 4) * 20,
            y: 45,
            bucketId: item.id,
            memoryId: item.memoryId,
            ownerId: who.id,
          },
          update: { label: item.title, enabled: true, memoryId: item.memoryId },
        });
        await tx.keepsake.upsert({
          where: {
            userId_sourceKey: {
              userId: who.id,
              sourceKey: `bucket:${item.id}`,
            },
          },
          create: {
            userId: who.id,
            sourceKey: `bucket:${item.id}`,
            type: "bucket",
            title: item.title,
            body: "One more beautiful memory made ♡",
            memoryId: item.memoryId,
          },
          update: { title: item.title, memoryId: item.memoryId },
        });
      } else
        await tx.gardenFlower.updateMany({
          where: { eventKey: `bucket:${item.id}` },
          data: { enabled: false },
        });
      return item;
    });
    return NextResponse.json(saved);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "This idea could not be saved.",
      },
      { status: 400 },
    );
  }
}
export async function DELETE(req: NextRequest) {
  const who = await actor();
  const { flags, settings } = await worldSettings();
  if (
    !who ||
    !sameOrigin(req, true) ||
    flags["bucket-list"] === false ||
    (who.role !== "owner" && !settings.sharedBucket)
  )
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  const { id } = await req.json();
  await db.$transaction([
    db.gardenFlower.deleteMany({ where: { bucketId: id } }),
    db.bucketListItem.delete({ where: { id } }),
  ]);
  return NextResponse.json({ ok: true });
}
