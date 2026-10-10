import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { actor, permits } from "@/lib/world/auth";
import { sameOrigin } from "@/lib/security";
import {
  getContent,
  validateReferences,
  worldSettings,
} from "@/lib/world/repository";
import { progressSchema } from "@/lib/games/schemas";
import { readGameConfig } from "@/lib/games/content";
import { publicMemories } from "@/lib/memories";
export async function GET() {
  const who = await actor();
  const { flags } = await worldSettings();
  if (!who || flags.keepsakes === false)
    return NextResponse.json(
      { error: "Sign in to your own keepsake drawer." },
      { status: 401 },
    );
  const ids = new Set((await publicMemories()).map((memory) => memory.id));
  const items = await db.keepsake.findMany({
    where: { userId: who.id },
    orderBy: { createdAt: "desc" },
  });
  const booth = await db.photoBoothCreation.findMany({
    where: { userId: who.id },
    include: { asset: true },
  });
  return NextResponse.json({
    items: items.filter((item) => !item.memoryId || ids.has(item.memoryId)),
    booth: booth.map((item) => ({
      id: item.id,
      assetId: item.assetId,
      caption: item.caption,
      url: `/api/world/media/${item.assetId}`,
    })),
    progress: JSON.parse(
      (await db.gameProgress.findUnique({ where: { userId: who.id } }))?.data ||
        "null",
    ),
  });
}
export async function POST(req: NextRequest) {
  const who = await actor();
  const { flags } = await worldSettings();
  if (!who || !sameOrigin(req, true) || flags.keepsakes === false)
    return NextResponse.json(
      { error: "Sign in before keeping a surprise." },
      { status: 401 },
    );
  const input = await req.json().catch(() => null);
  try {
    if (input?.action === "progress") {
      const progress = progressSchema.parse(input.progress);
      const config = await readGameConfig();
      const rewards = (
        await db.worldContent.findMany({
          where: { kind: "rewards", enabled: true },
        })
      ).filter((record) => permits(record, who));
      const valid = progress.completedGameIds.filter((id) => {
        if (id === "hearts")
          return config.hearts
            .filter((heart) => heart.enabled)
            .every((heart) => progress.collectedHeartIds.includes(heart.id));
        if (id === "quiz") return progress.quizResults.length > 0;
        if (id === "match")
          return Object.keys(progress.matchedPairsBest).length > 0;
        if (id === "guess") return progress.discoveredMemoryIds.length > 0;
        return true;
      });
      await db.$transaction(async (tx) => {
        await tx.gameProgress.upsert({
          where: { userId: who.id },
          create: { userId: who.id, data: JSON.stringify(progress) },
          update: { data: JSON.stringify(progress) },
        });
        for (const gameId of valid) {
          const reward = rewards.find(
            (record) => JSON.parse(record.metadata).gameId === gameId,
          );
          await tx.rewardUnlock.upsert({
            where: { userId_gameId: { userId: who.id, gameId } },
            create: { userId: who.id, gameId },
            update: {},
          });
          await tx.keepsake.upsert({
            where: {
              userId_sourceKey: { userId: who.id, sourceKey: `game:${gameId}` },
            },
            create: {
              userId: who.id,
              sourceKey: `game:${gameId}`,
              type: "game",
              contentId: reward?.id,
              title:
                reward?.title ||
                config.games.find((game) => game.id === gameId)!.title,
              body:
                reward?.body ||
                (gameId === "hearts"
                  ? config.messages.heartReward
                  : "A little paper flower for a surprise you've found. ♡"),
            },
            update: {},
          });
        }
      });
      return NextResponse.json({ ok: true });
    }
    const parsed = z
      .object({
        memoryId: z.string().optional(),
        contentId: z.string().optional(),
      })
      .parse(input);
    if (!parsed.memoryId && !parsed.contentId)
      throw new Error("Choose something to keep.");
    await validateReferences(parsed.memoryId ? [parsed.memoryId] : [], [], who);
    const content = parsed.contentId
      ? await getContent(parsed.contentId, who)
      : null;
    if (
      parsed.contentId &&
      (!content ||
        (content.capsule &&
          (content.capsule.status === "revoked" ||
            content.capsule.unlockAt > new Date())))
    )
      throw new Error("This content is not available yet.");
    const memory = (await publicMemories()).find(
      (memory) => memory.id === parsed.memoryId,
    );
    const sourceKey = parsed.contentId
      ? `content:${parsed.contentId}`
      : `memory:${parsed.memoryId}`;
    const saved = await db.keepsake.upsert({
      where: { userId_sourceKey: { userId: who.id, sourceKey } },
      create: {
        userId: who.id,
        sourceKey,
        type: content?.kind || "photo",
        title: content?.title || memory!.title,
        memoryId: parsed.memoryId,
        contentId: parsed.contentId,
      },
      update: {},
    });
    return NextResponse.json(saved);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "This keepsake could not be saved.",
      },
      { status: 400 },
    );
  }
}
export async function DELETE(req: NextRequest) {
  const who = await actor();
  if (!who || !sameOrigin(req, true))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const input = await req.json();
  if (input.action === "reset-games") {
    await db.$transaction([
      db.keepsake.deleteMany({ where: { userId: who.id, type: "game" } }),
      db.rewardUnlock.deleteMany({ where: { userId: who.id } }),
      db.gameProgress.deleteMany({ where: { userId: who.id } }),
    ]);
  } else
    await db.keepsake.deleteMany({ where: { id: input.id, userId: who.id } });
  return NextResponse.json({ ok: true });
}
