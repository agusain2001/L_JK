import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { authorize, sameOrigin } from "@/lib/security";
import { actor } from "@/lib/world/auth";
import {
  contentSchema,
  locationSchema,
  flowerSchema,
  settingsSchema,
  featureIds,
} from "@/lib/world/schemas";
import { ensureWorld } from "@/lib/world/seed";
import { validateReferences, worldSettings } from "@/lib/world/repository";
import { publicMemories } from "@/lib/memories";
export async function GET() {
  const who = await actor();
  if (who?.role !== "owner")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await ensureWorld();
  return NextResponse.json({
    ...(await worldSettings()),
    content: await db.worldContent.findMany({
      include: { capsule: true, attachments: true, memories: true },
      orderBy: { displayOrder: "asc" },
    }),
    locations: await db.memoryLocation.findMany({
      include: { memories: true },
    }),
    flowers: await db.gardenFlower.findMany(),
    assets: (await db.mediaAsset.findMany()).map((asset) => ({
      ...asset,
      storageKey: undefined,
      url: `/api/world/media/${asset.id}`,
    })),
    memories: await publicMemories(),
    users: await db.user.findMany({
      select: { id: true, name: true, email: true, active: true },
    }),
    invitations: await db.invitation.findMany({
      select: {
        id: true,
        email: true,
        expiresAt: true,
        revoked: true,
        usedAt: true,
      },
    }),
  });
}
export async function POST(req: NextRequest) {
  if (!(await authorize(req)) || !sameOrigin(req, true))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (Number(req.headers.get("content-length")) > 300000)
    return NextResponse.json(
      { error: "This content is too large." },
      { status: 413 },
    );
  const input = await req.json().catch(() => null);
  const who = await actor();
  await ensureWorld();
  try {
    if (input?.entity === "content") {
      const parsed = contentSchema.parse(input.data);
      const {
        id,
        memoryIds,
        assetIds,
        metadata,
        unlockAt,
        timeZone,
        status,
        ...fields
      } = parsed;
      await validateReferences(memoryIds, assetIds, who);
      const attachments = await db.mediaAsset.findMany({
        where: { id: { in: assetIds } },
      });
      if (parsed.enabled && attachments.some((asset) => !asset.approved))
        throw new Error("Approve attachments before publishing this content.");
      if (
        parsed.audience === "public" &&
        attachments.some((asset) => asset.audience !== "public")
      )
        throw new Error(
          "Public content requires public attachments. Keep personal recordings private.",
        );
      if (
        parsed.recipientId &&
        !(await db.user.findUnique({ where: { id: parsed.recipientId } }))
      )
        throw new Error("Choose an invited recipient.");
      const saved = await db.$transaction(async (tx) => {
        const data = {
          ...fields,
          recipientId: parsed.recipientId || null,
          date: parsed.date || null,
          ownerId: "site-owner",
          metadata: JSON.stringify(metadata),
        };
        const content = id
          ? await tx.worldContent.update({ where: { id }, data })
          : await tx.worldContent.create({ data });
        await tx.contentAttachment.deleteMany({
          where: { contentId: content.id },
        });
        await tx.contentMemory.deleteMany({ where: { contentId: content.id } });
        for (const assetId of new Set(assetIds))
          await tx.contentAttachment.create({
            data: { contentId: content.id, assetId },
          });
        for (const memoryId of new Set(memoryIds))
          await tx.contentMemory.create({
            data: { contentId: content.id, memoryId },
          });
        if (content.kind === "capsules")
          await tx.timeCapsule.upsert({
            where: { contentId: content.id },
            create: {
              contentId: content.id,
              unlockAt: new Date(unlockAt!),
              timeZone,
              status,
            },
            update: { unlockAt: new Date(unlockAt!), timeZone, status },
          });
        return content;
      });
      return NextResponse.json({ ok: true, id: saved.id });
    }
    if (input?.entity === "location") {
      const { id, memoryIds, ...data } = locationSchema.parse(input.data);
      await validateReferences(memoryIds, [], who);
      const saved = await db.$transaction(async (tx) => {
        const record = id
          ? await tx.memoryLocation.update({ where: { id }, data })
          : await tx.memoryLocation.create({
              data: { ...data, ownerId: "site-owner" },
            });
        await tx.locationMemory.deleteMany({
          where: { locationId: record.id },
        });
        for (const memoryId of new Set(memoryIds))
          await tx.locationMemory.create({
            data: { locationId: record.id, memoryId },
          });
        return record;
      });
      return NextResponse.json({ ok: true, id: saved.id });
    }
    if (input?.entity === "flower") {
      const { id, ...data } = flowerSchema.parse(input.data);
      await validateReferences(data.memoryId ? [data.memoryId] : [], [], who);
      if (
        data.contentId &&
        !(await db.worldContent.findUnique({ where: { id: data.contentId } }))
      )
        throw new Error("Choose an existing milestone.");
      if (
        data.bucketId &&
        !(await db.bucketListItem.findFirst({
          where: { id: data.bucketId, completed: true },
        }))
      )
        throw new Error("Choose a completed activity.");
      const saved = id
        ? await db.gardenFlower.update({ where: { id }, data })
        : await db.gardenFlower.upsert({
            where: { eventKey: data.eventKey },
            create: { ...data, ownerId: "site-owner" },
            update: data,
          });
      return NextResponse.json({ ok: true, id: saved.id });
    }
    if (input?.entity === "settings") {
      const settings = settingsSchema.parse(input.data);
      await db.featureSettings.upsert({
        where: { key: "world" },
        create: { key: "world", configuration: JSON.stringify(settings) },
        update: { configuration: JSON.stringify(settings) },
      });
      for (const id of featureIds)
        if (typeof input.flags?.[id] === "boolean")
          await db.featureSettings.upsert({
            where: { key: id },
            create: { key: id, enabled: input.flags[id] },
            update: { enabled: input.flags[id] },
          });
      return NextResponse.json({ ok: true });
    }
    if (input?.entity === "asset") {
      const data = input.data;
      if (
        !["public", "private"].includes(data.audience) ||
        typeof data.approved !== "boolean"
      )
        throw new Error("Choose an audience and approval state.");
      await db.mediaAsset.update({
        where: { id: data.id },
        data: {
          title: String(data.title).slice(0, 140),
          approved: data.approved,
          audience: data.audience,
          recipientId: data.recipientId || null,
        },
      });
      return NextResponse.json({ ok: true });
    }
    throw new Error("Choose content to save.");
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Content could not be saved.",
      },
      { status: 400 },
    );
  }
}
export async function DELETE(req: NextRequest) {
  if (!(await authorize(req)) || !sameOrigin(req, true))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const input = await req.json();
  if (input.entity === "content")
    await db.worldContent.delete({ where: { id: input.id } });
  else if (input.entity === "location")
    await db.memoryLocation.delete({ where: { id: input.id } });
  else if (input.entity === "flower")
    await db.gardenFlower.delete({ where: { id: input.id } });
  else return NextResponse.json({ error: "Unknown record." }, { status: 400 });
  return NextResponse.json({ ok: true });
}
