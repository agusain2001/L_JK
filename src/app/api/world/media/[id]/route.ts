import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { actor, permits } from "@/lib/world/auth";
import { privateStorage } from "@/lib/world/storage";
import { sameOrigin } from "@/lib/security";
import { worldSettings, rewardVisible } from "@/lib/world/repository";
async function accessible(id: string) {
  const who = await actor();
  const asset = await db.mediaAsset.findUnique({
    where: { id },
    include: {
      attachments: { include: { content: { include: { capsule: true } } } },
      booth: true,
    },
  });
  if (!asset) return null;
  if (who?.role === "owner") return asset;
  if (who && asset.booth.some((creation) => creation.userId === who.id))
    return asset;
  const { flags, settings } = await worldSettings();
  if (
    (!who && !settings.guestAccess) ||
    !asset.approved ||
    !permits(asset, who)
  )
    return null;
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
  return asset.attachments.some(
    ({ content }) =>
      flags[content.kind] !== false &&
      (content.kind !== "rewards" || flags.keepsakes !== false) &&
      rewardVisible(content, who, unlocked) &&
      content.enabled &&
      permits(content, who) &&
      (!content.capsule ||
        (content.capsule.status !== "revoked" &&
          content.capsule.unlockAt <= new Date())),
  )
    ? asset
    : null;
}
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const asset = await accessible((await params).id);
  if (!asset) return new NextResponse(null, { status: 404 });
  try {
    const bytes = await privateStorage.read(asset.storageKey);
    const headers: Record<string, string> = {
      "Content-Type": asset.mime,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
      "Accept-Ranges": "bytes",
    };
    const range = req.headers.get("range");
    if (range) {
      const match = /^bytes=(\d*)-(\d*)$/.exec(range);
      if (!match || (!match[1] && !match[2]))
        return new NextResponse(null, {
          status: 416,
          headers: { "Content-Range": `bytes */${bytes.length}` },
        });
      const start = match[1]
        ? Number(match[1])
        : Math.max(0, bytes.length - Number(match[2]));
      const end =
        match[1] && match[2]
          ? Math.min(Number(match[2]), bytes.length - 1)
          : bytes.length - 1;
      if (start > end || start >= bytes.length)
        return new NextResponse(null, {
          status: 416,
          headers: { "Content-Range": `bytes */${bytes.length}` },
        });
      return new NextResponse(new Uint8Array(bytes.subarray(start, end + 1)), {
        status: 206,
        headers: {
          ...headers,
          "Content-Range": `bytes ${start}-${end}/${bytes.length}`,
          "Content-Length": String(end - start + 1),
        },
      });
    }
    return new NextResponse(new Uint8Array(bytes), {
      headers: { ...headers, "Content-Length": String(bytes.length) },
    });
  } catch {
    return new NextResponse(null, { status: 404 });
  }
}
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const who = await actor();
  if (!who || !sameOrigin(req, true))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const asset = await db.mediaAsset.findUnique({
    where: { id: (await params).id },
  });
  if (!asset || (who.role !== "owner" && asset.ownerId !== who.id))
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  await privateStorage.remove(asset.storageKey);
  await db.$transaction([
    db.keepsake.deleteMany({ where: { assetId: asset.id } }),
    db.mediaAsset.delete({ where: { id: asset.id } }),
  ]);
  return NextResponse.json({ ok: true });
}
