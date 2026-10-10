import { NextResponse } from "next/server";
import { galleryStorage } from "@/lib/media-storage";
import { db } from "@/lib/db";
import { isAdmin } from "@/lib/security";
import { actor, permits } from "@/lib/world/auth";
export const dynamic = "force-dynamic";
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ filename: string }> },
) {
  const { filename } = await params;
  if (!/^[a-f0-9-]+\.jpg$/.test(filename))
    return new NextResponse(null, { status: 404 });
  const memory = await db.memory.findUnique({
    where: { mediaUrl: `/uploads/${filename}` },
  });
  if (!memory || (!memory.approved && !(await isAdmin())) || !permits(memory, await actor()))
    return new NextResponse(null, { status: 404 });
  try {
    const file = await galleryStorage.read(filename);
    return new NextResponse(new Uint8Array(file), {
      headers: {
        "Content-Type": "image/jpeg",
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new NextResponse(null, { status: 404 });
  }
}
