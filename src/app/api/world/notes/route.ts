import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { actor, rateLimit } from "@/lib/world/auth";
import { sameOrigin } from "@/lib/security";
import { messageSchema } from "@/lib/world/schemas";
import {
  pruneNotes,
  validateReferences,
  worldSettings,
} from "@/lib/world/repository";
export async function GET(req: NextRequest) {
  const who = await actor();
  const { flags, settings } = await worldSettings();
  if (!who || flags.notes === false)
    return NextResponse.json(
      { error: "These notes are just for invited participants." },
      { status: 401 },
    );
  await pruneNotes(settings);
  const cursor = req.nextUrl.searchParams.get("cursor");
  const limit = Math.min(
    20,
    Math.max(1, Number(req.nextUrl.searchParams.get("limit")) || 10),
  );
  const notes = await db.privateMessage.findMany({
    where:
      who.role === "owner"
        ? {}
        : { OR: [{ senderId: who.id }, { recipientId: who.id }] },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  });
  const more = notes.length > limit;
  const items = notes.slice(0, limit);
  await db.privateMessage.updateMany({
    where: {
      id: {
        in: items
          .filter((note) => note.recipientId === who.id)
          .map((note) => note.id),
      },
      readAt: null,
    },
    data: { readAt: new Date() },
  });
  const users = await db.user.findMany({
    where: {
      active: true,
      ...(who.role !== "owner" ? { id: "site-owner" } : {}),
    },
    select: { id: true, name: true },
  });
  return NextResponse.json({
    items,
    nextCursor: more ? items.at(-1)?.id : null,
    users,
    retentionDays: settings.noteRetentionDays,
  });
}
export async function POST(req: NextRequest) {
  const who = await actor();
  const { flags } = await worldSettings();
  if (!who || !sameOrigin(req, true) || flags.notes === false)
    return NextResponse.json(
      { error: "Sign in before sending a private note." },
      { status: 401 },
    );
  try {
    const input = messageSchema.parse(await req.json());
    const submissionKey = input.submissionKey
      ? `${who.id}:${input.submissionKey}`
      : null;
    if (submissionKey) {
      const existing = await db.privateMessage.findUnique({
        where: { submissionKey },
      });
      if (existing) return NextResponse.json(existing, { status: 201 });
    }
    if (
      input.recipientId === who.id ||
      (who.role !== "owner" && input.recipientId !== "site-owner") ||
      !(await db.user.findFirst({
        where: { id: input.recipientId, active: true },
      }))
    )
      throw new Error("Choose the intended participant.");
    await validateReferences(input.memoryId ? [input.memoryId] : [], [], who);
    if (
      input.replyToId &&
      !(await db.privateMessage.findFirst({
        where: {
          id: input.replyToId,
          OR: [
            { senderId: who.id, recipientId: input.recipientId },
            { senderId: input.recipientId, recipientId: who.id },
          ],
        },
      }))
    )
      throw new Error("The original note is no longer available.");
    if (!(await rateLimit(`note:${who.id}`, 5, 60)))
      return NextResponse.json(
        { error: "Let the little mailbox rest for a minute." },
        { status: 429 },
      );
    const data = { ...input, submissionKey, senderId: who.id };
    const note = submissionKey
      ? await db.privateMessage.upsert({
          where: { submissionKey },
          create: data,
          update: {},
        })
      : await db.privateMessage.create({ data });
    return NextResponse.json(note, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "The note could not be sent.",
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
  const deleted = await db.privateMessage.deleteMany({
    where: {
      id: input.id,
      ...(who.role !== "owner" ? { senderId: who.id } : {}),
    },
  });
  return NextResponse.json(
    { ok: !!deleted.count },
    { status: deleted.count ? 200 : 404 },
  );
}
