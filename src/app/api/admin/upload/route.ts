import { NextRequest, NextResponse } from "next/server";
import { authorize } from "@/lib/security";
import { db } from "@/lib/db";
import { serializeMemory } from "@/lib/memories";
import { galleryStorage } from "@/lib/media-storage";
import { randomUUID } from "node:crypto";
import sharp from "sharp";
export async function POST(req: NextRequest) {
  if (!(await authorize(req)))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (Number(req.headers.get("content-length")) > 25 * 1024 * 1024)
    return NextResponse.json(
      { error: "Maximum upload size is 20 MB." },
      { status: 413 },
    );
  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File) || file.size > 20 * 1024 * 1024)
    return NextResponse.json(
      { error: "Choose a photograph smaller than 20 MB." },
      { status: 400 },
    );
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type))
    return NextResponse.json(
      {
        error:
          "Upload a JPG, PNG, or WebP photograph. Add videos using a reliable HTTPS URL and poster.",
      },
      { status: 400 },
    );
  try {
    const filename = `${randomUUID()}.jpg`;
    const buffer = await sharp(Buffer.from(await file.arrayBuffer()), {
      limitInputPixels: 40000000,
    })
      .rotate()
      .resize(1600, 1600, { fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: 88 })
      .toBuffer();
    await galleryStorage.put(filename, buffer, "image/jpeg");
    const memory = await db.memory.create({
      data: {
        title: file.name.replace(/\.[^.]+$/, "").slice(0, 120),
        mediaUrl: `/uploads/${filename}`,
        approved: false,
      },
    });
    return NextResponse.json(serializeMemory(memory));
  } catch (error) {
    console.error("Photo upload could not be decoded:", error);
    return NextResponse.json(
      { error: "This file could not be read as a photograph." },
      { status: 400 },
    );
  }
}
