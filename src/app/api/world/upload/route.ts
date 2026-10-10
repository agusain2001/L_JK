import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import sharp from "sharp";
import { db } from "@/lib/db";
import { actor, rateLimit } from "@/lib/world/auth";
import { privateStorage } from "@/lib/world/storage";
import { sameOrigin } from "@/lib/security";
import { worldSettings } from "@/lib/world/repository";
function audioMime(bytes: Buffer) {
  if (
    bytes.subarray(0, 4).toString() === "RIFF" &&
    bytes.subarray(8, 12).toString() === "WAVE"
  )
    return { mime: "audio/wav", extension: "wav" };
  if (
    bytes.subarray(0, 3).toString() === "ID3" ||
    (bytes[0] === 255 && (bytes[1] & 224) === 224)
  )
    return { mime: "audio/mpeg", extension: "mp3" };
  if (bytes.subarray(0, 4).toString() === "OggS")
    return { mime: "audio/ogg", extension: "ogg" };
  if (bytes.subarray(4, 8).toString() === "ftyp")
    return { mime: "audio/mp4", extension: "m4a" };
  if (bytes.subarray(0, 4).equals(Buffer.from([26, 69, 223, 163])))
    return { mime: "audio/webm", extension: "webm" };
  return null;
}
export async function POST(req: NextRequest) {
  const who = await actor();
  if (!who || !sameOrigin(req, true))
    return NextResponse.json(
      { error: "Sign in before saving or uploading." },
      { status: 401 },
    );
  if (!(await rateLimit(`upload:${who.id}`, 12, 300)))
    return NextResponse.json(
      { error: "Please try uploading again in a few minutes." },
      { status: 429 },
    );
  if (Number(req.headers.get("content-length")) > 21 * 1024 * 1024)
    return NextResponse.json(
      { error: "Use a file smaller than 20 MB." },
      { status: 413 },
    );
  const form = await req.formData().catch(() => null);
  const file = form?.get("file"),
    purpose = form?.get("purpose");
  if (!(file instanceof File) || file.size > 20 * 1024 * 1024 || !file.size)
    return NextResponse.json(
      { error: "Choose a nonempty file smaller than 20 MB." },
      { status: 400 },
    );
  const { settings } = await worldSettings();
  if (who.role !== "owner" && (purpose !== "booth" || !settings.boothSharing))
    return NextResponse.json(
      { error: "Saving photo-booth submissions is currently disabled." },
      { status: 403 },
    );
  let bytes = Buffer.from(await file.arrayBuffer()),
    mime = "",
    extension = "";
  try {
    if (purpose === "booth" || file.type.startsWith("image/")) {
      bytes = await sharp(bytes, { limitInputPixels: 40000000 })
        .rotate()
        .resize(2000, 4000, { fit: "inside", withoutEnlargement: true })
        .png()
        .toBuffer();
      mime = "image/png";
      extension = "png";
    } else {
      if (who.role !== "owner" || !file.type.startsWith("audio/"))
        throw new Error();
      const detected = audioMime(bytes);
      if (!detected) throw new Error();
      ({ mime, extension } = detected);
    }
  } catch {
    return NextResponse.json(
      {
        error:
          "Upload a readable JPG/PNG/WebP or MP3, WAV, M4A, OGG, or WebM audio file.",
      },
      { status: 400 },
    );
  }
  const storageKey = `${randomUUID()}.${extension}`;
  try {
    await privateStorage.put(storageKey, bytes, mime);
    const asset = await db.mediaAsset.create({
      data: {
        storageKey,
        mime,
        bytes: bytes.length,
        title: file.name.slice(0, 140),
        ownerId: who.id,
        audience: "private",
        recipientId: who.role === "recipient" ? who.id : null,
        approved: false,
        ...(purpose === "booth"
          ? {
              booth: {
                create: {
                  userId: who.id,
                  caption: String(form?.get("caption") || "").slice(0, 180),
                },
              },
            }
          : {}),
      },
    });
    return NextResponse.json(
      {
        id: asset.id,
        title: asset.title,
        mime: asset.mime,
        approved: false,
        url: `/api/world/media/${asset.id}`,
      },
      { status: 201 },
    );
  } catch {
    await privateStorage.remove(storageKey).catch(() => {});
    return NextResponse.json(
      { error: "The file could not be stored. Please try again." },
      { status: 500 },
    );
  }
}
