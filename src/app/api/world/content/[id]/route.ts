import { NextRequest, NextResponse } from "next/server";
import { actor } from "@/lib/world/auth";
import {
  getContent,
  serializeContent,
  worldSettings,
} from "@/lib/world/repository";
import { publicMemories } from "@/lib/memories";
import { db } from "@/lib/db";
import { sameOrigin } from "@/lib/security";
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const who = await actor();
  const record = await getContent((await params).id, who);
  const { flags, settings } = await worldSettings();
  if (
    !record ||
    flags[record.kind] === false ||
    (record.kind === "rewards" && flags.keepsakes === false) ||
    (!who && !settings.guestAccess) ||
    (record.capsule &&
      (record.capsule.status === "revoked" ||
        record.capsule.unlockAt > new Date()))
  )
    return NextResponse.json(
      { error: "This keepsake is not available yet." },
      { status: 404 },
    );
  return NextResponse.json(
    serializeContent(
      record,
      who,
      new Set((await publicMemories()).map((memory) => memory.id)),
    ),
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!sameOrigin(req, true))
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  const who = await actor();
  const record = await getContent((await params).id, who);
  const { flags } = await worldSettings();
  if (
    !who ||
    !record?.capsule ||
    flags.capsules === false ||
    record.capsule.status === "revoked" ||
    record.capsule.unlockAt > new Date()
  )
    return NextResponse.json(
      { error: "This capsule is unavailable." },
      { status: 403 },
    );
  await db.capsuleOpening.upsert({
    where: {
      userId_capsuleId: { userId: who.id, capsuleId: record.capsule.id },
    },
    create: { userId: who.id, capsuleId: record.capsule.id },
    update: {},
  });
  return NextResponse.json({ ok: true });
}
