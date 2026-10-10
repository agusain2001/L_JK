import "server-only";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { headers } from "next/headers";
import { createHash, randomBytes } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { db } from "@/lib/db";
import { isAdmin } from "@/lib/security";
import type { WorldActor } from "./schemas";
function secret() {
  if (process.env.BETTER_AUTH_SECRET) return process.env.BETTER_AUTH_SECRET;
  const file = path.join(
    process.cwd(),
    ".data",
    process.env.NEXT_TEST_BUILD === "1" ? "auth-test-secret" : "auth-secret",
  );
  mkdirSync(path.dirname(file), { recursive: true });
  if (!existsSync(file)) {
    try {
      writeFileSync(file, randomBytes(48).toString("hex"), { flag: "wx" });
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error;
    }
  }
  return readFileSync(file, "utf8");
}
export const auth = betterAuth({
  database: prismaAdapter(db, {
    provider:
      process.env.DATABASE_PROVIDER === "postgresql" ? "postgresql" : "sqlite",
  }),
  secret: secret(),
  baseURL:
    process.env.BETTER_AUTH_URL ||
    (process.env.NEXT_TEST_BUILD === "1"
      ? "http://127.0.0.1:3001"
      : "http://127.0.0.1:3000"),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 12,
    maxPasswordLength: 128,
  },
  session: { expiresIn: 7 * 86400, cookieCache: { enabled: false } },
  rateLimit: { enabled: true, window: 60, max: 30 },
  user: {
    additionalFields: {
      active: { type: "boolean", defaultValue: true, input: false },
    },
  },
  advanced: { useSecureCookies: process.env.NODE_ENV === "production" },
});
export const tokenHash = (token: string) =>
  createHash("sha256").update(token).digest("hex");
export async function actor(): Promise<WorldActor> {
  if (await isAdmin())
    return { id: "site-owner", name: "The owner", role: "owner" };
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return null;
  const user = await db.user.findUnique({ where: { id: session.user.id } });
  return user?.active
    ? { id: user.id, name: user.name, role: "recipient" }
    : null;
}
export function permits(
  scope: { audience: string; recipientId?: string | null; ownerId?: string },
  who: WorldActor,
) {
  return (
    who?.role === "owner" ||
    scope.audience === "public" ||
    (!!who &&
      (!scope.recipientId ||
        scope.recipientId === who.id ||
        scope.ownerId === who.id))
  );
}
export async function rateLimit(key: string, max: number, seconds = 60) {
  const now = new Date();
  return db.$transaction(async (tx) => {
    await tx.requestLimit.deleteMany({ where: { key, resetAt: { lte: now } } });
    const state = await tx.requestLimit.upsert({
      where: { key },
      create: {
        key,
        count: 1,
        resetAt: new Date(now.getTime() + seconds * 1000),
      },
      update: { count: { increment: 1 } },
    });
    return state.count <= max;
  });
}
