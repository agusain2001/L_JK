import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { randomBytes } from "node:crypto";
import { db } from "@/lib/db";
import { authorize, sameOrigin } from "@/lib/security";
import { auth, tokenHash, rateLimit } from "@/lib/world/auth";
export async function POST(req: NextRequest) {
  if (!sameOrigin(req, true))
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  const input = await req.json().catch(() => null);
  if (input?.action === "invite") {
    if (!(await authorize(req)))
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const parsed = z
      .object({
        email: z.email(),
        days: z.number().int().min(1).max(14).default(3),
      })
      .safeParse(input);
    if (!parsed.success)
      return NextResponse.json(
        { error: "Enter a valid recipient email and expiry." },
        { status: 400 },
      );
    const token = randomBytes(32).toString("hex");
    const invitation = await db.invitation.create({
      data: {
        email: parsed.data.email.toLowerCase(),
        tokenHash: tokenHash(token),
        expiresAt: new Date(Date.now() + parsed.data.days * 86400000),
      },
    });
    return NextResponse.json({
      id: invitation.id,
      url: `/world/access?invite=${token}`,
      expiresAt: invitation.expiresAt,
    });
  }
  if (
    !(await rateLimit(
      `invite:${req.headers.get("x-forwarded-for") || "local"}`,
      8,
      900,
    ))
  )
    return NextResponse.json(
      { error: "Please try again later." },
      { status: 429 },
    );
  const parsed = z
    .object({
      token: z.string().regex(/^[a-f0-9]{64}$/),
      name: z.string().trim().min(1).max(80),
      password: z.string().min(12).max(128),
    })
    .safeParse(input);
  if (!parsed.success)
    return NextResponse.json(
      {
        error:
          "Use your invitation, a name, and a password of at least 12 characters.",
      },
      { status: 400 },
    );
  const invitation = await db.invitation.findUnique({
    where: { tokenHash: tokenHash(parsed.data.token) },
  });
  if (
    !invitation ||
    invitation.revoked ||
    invitation.usedAt ||
    invitation.expiresAt <= new Date()
  )
    return NextResponse.json(
      { error: "This invitation is expired, revoked, or already used." },
      { status: 403 },
    );
  const reserved = await db.invitation.updateMany({
    where: {
      id: invitation.id,
      usedAt: null,
      revoked: false,
      expiresAt: { gt: new Date() },
    },
    data: { usedAt: new Date() },
  });
  if (!reserved.count)
    return NextResponse.json(
      { error: "This invitation has already been used." },
      { status: 403 },
    );
  try {
    const response = await auth.api.signUpEmail({
      body: {
        email: invitation.email,
        name: parsed.data.name,
        password: parsed.data.password,
      },
      asResponse: true,
    });
    if (!response.ok)
      await db.invitation.update({
        where: { id: invitation.id },
        data: { usedAt: null },
      });
    return response;
  } catch {
    await db.invitation.update({
      where: { id: invitation.id },
      data: { usedAt: null },
    });
    return NextResponse.json(
      {
        error:
          "The account could not be created. Contact the owner or sign in if it already exists.",
      },
      { status: 400 },
    );
  }
}
export async function DELETE(req: NextRequest) {
  if (!(await authorize(req)) || !sameOrigin(req, true))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const input = await req.json();
  if (input.userId) {
    await db.user.update({
      where: { id: input.userId },
      data: { active: false },
    });
    await db.session.deleteMany({ where: { userId: input.userId } });
  }
  if (input.invitationId)
    await db.invitation.update({
      where: { id: input.invitationId },
      data: { revoked: true },
    });
  return NextResponse.json({ ok: true });
}
