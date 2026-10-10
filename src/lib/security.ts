import "server-only";
import { cookies } from "next/headers";
import { createHmac, timingSafeEqual, randomBytes } from "node:crypto";
import type { NextRequest } from "next/server";
const cookieName = "for-you-admin";
export function adminEnabled() {
  return !!process.env.ADMIN_SECRET && process.env.ADMIN_SECRET.length >= 24;
}
function sign(value: string) {
  return createHmac("sha256", process.env.ADMIN_SECRET || "")
    .update(value)
    .digest("hex");
}
export function equal(a: string, b: string) {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}
export async function isAdmin() {
  if (!adminEnabled()) return false;
  const token = (await cookies()).get(cookieName)?.value;
  if (!token) return false;
  const [expires, nonce, signature] = token.split(".");
  return (
    Number(expires) > Date.now() &&
    !!nonce &&
    !!signature &&
    equal(signature, sign(`${expires}.${nonce}`))
  );
}
export async function login() {
  const expires = Date.now() + 8 * 3600 * 1000;
  const payload = `${expires}.${randomBytes(16).toString("hex")}`;
  (await cookies()).set(cookieName, `${payload}.${sign(payload)}`, {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    maxAge: 8 * 3600,
    path: "/",
  });
}
export async function logout() {
  (await cookies()).delete(cookieName);
}
export function sameOrigin(req: NextRequest, required = false) {
  const origin = req.headers.get("origin");
  if (!origin) return !required;
  // Next normalizes its internal URL to localhost in development; Host is the
  // actual browser-facing authority. A browser cannot forge its Host header.
  return origin === `${req.nextUrl.protocol}//${req.headers.get("host")}`;
}
export async function authorize(req: NextRequest) {
  if (!sameOrigin(req)) return false;
  return isAdmin();
}
const attempts = new Map<string, { count: number; reset: number }>();
export function allowLogin(ip: string) {
  const now = Date.now();
  for (const [key, value] of attempts)
    if (value.reset < now) attempts.delete(key);
  const state = attempts.get(ip) ?? { count: 0, reset: now + 15 * 60 * 1000 };
  state.count++;
  attempts.set(ip, state);
  return state.count <= 8;
}
