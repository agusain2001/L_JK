import { NextRequest, NextResponse } from "next/server";
import {
  adminEnabled,
  equal,
  login,
  logout,
  allowLogin,
  authorize,
  sameOrigin,
} from "@/lib/security";
export async function POST(req: NextRequest) {
  if (!adminEnabled())
    return NextResponse.json(
      {
        error:
          "Admin is disabled. Set ADMIN_SECRET to at least 24 characters in .env.",
      },
      { status: 503 },
    );
  if (!sameOrigin(req, true))
    return NextResponse.json({ error: "Invalid origin." }, { status: 403 });
  if (!allowLogin(req.headers.get("x-forwarded-for")?.split(",")[0] || "local"))
    return NextResponse.json(
      { error: "Too many attempts. Try again in 15 minutes." },
      { status: 429 },
    );
  const body = await req.json().catch(() => ({}));
  if (
    typeof body.password !== "string" ||
    !equal(body.password, process.env.ADMIN_SECRET!)
  )
    return NextResponse.json(
      { error: "That password is not correct." },
      { status: 401 },
    );
  await login();
  return NextResponse.json({ ok: true });
}
export async function DELETE(req: NextRequest) {
  if (!(await authorize(req)))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await logout();
  return NextResponse.json({ ok: true });
}
