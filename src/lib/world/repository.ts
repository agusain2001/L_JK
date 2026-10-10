import "server-only";
import { db } from "@/lib/db";
import { publicMemories } from "@/lib/memories";
import { ensureWorld } from "./seed";
import { actor, permits } from "./auth";
import { defaultWorldSettings } from "./features";
import {
  settingsSchema,
  type WorldActor,
  type WorldContent,
  type WorldSettings,
} from "./schemas";
import { calendarDay, visibleCoordinates } from "./dates";
export { chooseDaily } from "./daily";
import { chooseDaily } from "./daily";
import type { Prisma } from "@prisma/client";
export async function worldSettings() {
  await ensureWorld();
  const rows = await db.featureSettings.findMany({ where: { NOT: { key: { startsWith: "internal:" } } } });
  return {
    flags: Object.fromEntries(rows.map((row) => [row.key, row.enabled])),
    settings: settingsSchema.parse({
      ...defaultWorldSettings,
      ...JSON.parse(
        rows.find((row) => row.key === "world")?.configuration || "{}",
      ),
    }),
  };
}
const includes = {
  capsule: { include: { openings: true } },
  attachments: { include: { asset: true } },
  memories: true,
} satisfies Prisma.WorldContentInclude;
export type ContentRecord = Prisma.WorldContentGetPayload<{
  include: typeof includes;
}>;
export function rewardVisible(
  record: { kind: string; metadata: string },
  who: WorldActor,
  unlocked: Set<string>,
) {
  return (
    record.kind !== "rewards" ||
    who?.role === "owner" ||
    (!!who && unlocked.has(JSON.parse(record.metadata).gameId))
  );
}
export function contentVisible(record: ContentRecord, who: WorldActor) {
  return (record.enabled || who?.role === "owner") && permits(record, who);
}
export function serializeContent(
  record: ContentRecord,
  who: WorldActor,
  allowedMemoryIds: Set<string>,
  preview = false,
): WorldContent {
  const locked =
    !!record.capsule &&
    (record.capsule.status === "revoked" ||
      record.capsule.unlockAt > new Date());
  const hidden = locked && !preview;
  return {
    id: record.id,
    kind: record.kind,
    title: record.title,
    description: record.description,
    body: hidden ? undefined : record.body,
    audience: record.audience,
    enabled: record.enabled,
    demo: record.demo,
    color: record.color,
    displayOrder: record.displayOrder,
    date: record.date,
    recurring: record.recurring,
    featured: record.featured,
    metadata: hidden ? {} : JSON.parse(record.metadata),
    memoryIds: hidden
      ? []
      : record.memories
          .filter((link) => allowedMemoryIds.has(link.memoryId))
          .map((link) => link.memoryId),
    assets: hidden
      ? []
      : record.attachments
          .filter(
            (link) =>
              (link.asset.approved || preview) && permits(link.asset, who),
          )
          .map(({ asset }) => ({
            id: asset.id,
            title: asset.title,
            mime: asset.mime,
            url: `/api/world/media/${asset.id}`,
          })),
    ...(record.capsule
      ? {
          unlockAt: record.capsule.unlockAt.toISOString(),
          timeZone: record.capsule.timeZone,
          status: record.capsule.status,
          locked,
          openedAt:
            record.capsule.openings
              .find((open) => open.userId === who?.id)
              ?.openedAt.toISOString() ?? null,
        }
      : {}),
  };
}
export async function worldData() {
  const who = await actor();
  const { flags, settings } = await worldSettings();
  const memories = await publicMemories();
  const available = who || settings.guestAccess;
  // An approved photograph is a growth event, never a visit-count reward.
  if (available) {
    for (const memory of await db.memory.findMany({
      where: { approved: true },
    }))
      await db.gardenFlower.upsert({
        where: { eventKey: `memory:${memory.id}` },
        create: {
          eventKey: `memory:${memory.id}`,
          label: memory.title || "A new memory",
          memoryId: memory.id,
          type: "wildflower",
          color: "#a3bfd0",
          x: 15 + (memory.order % 5) * 17,
          y: 45,
          ownerId: "site-owner",
        },
        update: {},
      });
  }
  const allowed = new Set(memories.map((memory) => memory.id));
  const records = available
    ? await db.worldContent.findMany({
        include: includes,
        orderBy: { displayOrder: "asc" },
      })
    : [];
  const unlocked = new Set(
    who
      ? (
          await db.rewardUnlock.findMany({
            where: { userId: who.id },
            select: { gameId: true },
          })
        ).map((row) => row.gameId)
      : [],
  );
  const content = records
    .filter(
      (record) =>
        rewardVisible(record, who, unlocked) &&
        (record.kind !== "rewards" || flags.keepsakes !== false) &&
        flags[record.kind] !== false &&
        contentVisible(record, who),
    )
    .map((record) => serializeContent(record, who, allowed));
  const locations =
    flags.map !== false && available
      ? (
          await db.memoryLocation.findMany({
            where: { enabled: true },
            include: { memories: true },
          })
        )
          .filter((record) => permits(record, who))
          .map((record) => ({
            ...record,
            ...visibleCoordinates(record),
            memoryIds: record.memories
              .filter((link) => allowed.has(link.memoryId))
              .map((link) => link.memoryId),
            memories: undefined,
            ownerId: undefined,
            recipientId: undefined,
          }))
      : [];
  const today = calendarDay(new Date(), settings.timeZone);
  const flowers =
    flags.garden !== false && available
      ? (
          await db.gardenFlower.findMany({
            where: { enabled: true },
            orderBy: { createdAt: "asc" },
          })
        ).filter((flower) => {
          if (flower.bucketId && !who) return false;
          if (
            flower.contentId &&
            !content.some(
              (record) => record.id === flower.contentId && !record.locked,
            )
          )
            return false;
          if (flower.memoryId && !allowed.has(flower.memoryId)) return false;
          return !!(flower.memoryId || flower.contentId || who);
        })
      : [];
  return {
    actor: who,
    flags,
    settings: {
      ...settings,
      surpriseIds: settings.surpriseIds.filter((id) => allowed.has(id)),
      excludedIds: settings.excludedIds.filter((id) => allowed.has(id)),
    },
    content,
    locations,
    memories: available ? memories : [],
    today,
    daily: chooseDaily(content, today) || null,
    flowers,
  };
}
export type WorldData = Awaited<ReturnType<typeof worldData>>;
export async function getContent(id: string, who: WorldActor) {
  await ensureWorld();
  const record = await db.worldContent.findUnique({
    where: { id },
    include: includes,
  });
  if (!record || !contentVisible(record, who)) return null;
  const unlocked = new Set(
    who && record.kind === "rewards"
      ? (
          await db.rewardUnlock.findMany({
            where: { userId: who.id },
            select: { gameId: true },
          })
        ).map((row) => row.gameId)
      : [],
  );
  return rewardVisible(record, who, unlocked) ? record : null;
}
export async function validateReferences(
  memoryIds: string[],
  assetIds: string[],
  who: WorldActor,
) {
  const memories = await publicMemories();
  if (memoryIds.some((id) => !memories.some((memory) => memory.id === id)))
    throw new Error("Use approved, permitted photographs.");
  const assets = await db.mediaAsset.findMany({
    where: { id: { in: assetIds } },
  });
  if (
    assetIds.some(
      (id) => !assets.some((asset) => asset.id === id && permits(asset, who)),
    )
  )
    throw new Error("One of the attachments is unavailable.");
}
export async function pruneNotes(settings: WorldSettings) {
  await db.privateMessage.deleteMany({
    where: {
      createdAt: {
        lt: new Date(Date.now() - settings.noteRetentionDays * 86400000),
      },
    },
  });
}
