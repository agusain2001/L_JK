import "server-only";
import { mkdir, readFile, writeFile, unlink } from "node:fs/promises";
import path from "node:path";
import { put, get, del } from "@vercel/blob";
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
function safe(key: string) {
  if (!/^[a-zA-Z0-9_.-]{1,100}$/.test(key) || key.includes(".."))
    throw new Error("Invalid media key.");
  return key;
}
const blobConfigured = () => !!(process.env.BLOB_READ_WRITE_TOKEN || process.env.BLOB_STORE_ID);
const client = () => new S3Client({
  region: process.env.S3_REGION || "us-east-1",
  ...(process.env.S3_ENDPOINT ? { endpoint: process.env.S3_ENDPOINT, forcePathStyle: true } : {}),
});
export function mediaStorage(folder: string, prefix: string) {
  const directory = () => path.join(process.cwd(), ".data", process.env.NEXT_TEST_BUILD === "1" ? `${folder}-test` : folder);
  return {
    async put(key: string, bytes: Buffer, mime: string) {
      safe(key);
      if (blobConfigured()) {
        await put(`${prefix}${key}`, bytes, { access: "private", addRandomSuffix: false, contentType: mime });
      } else if (process.env.S3_BUCKET) {
        await client().send(new PutObjectCommand({ Bucket: process.env.S3_BUCKET, Key: `${prefix}${key}`, Body: bytes, ContentType: mime }));
      } else {
        if (process.env.VERCEL) throw new Error("Configure private Blob or S3 storage before uploading.");
        await mkdir(directory(), { recursive: true });
        await writeFile(path.join(directory(), key), bytes);
      }
    },
    async read(key: string) {
      safe(key);
      if (blobConfigured()) {
        const result = await get(`${prefix}${key}`, { access: "private", useCache: false });
        if (result?.statusCode !== 200) throw new Error("Media not found.");
        return Buffer.from(await new Response(result.stream).arrayBuffer());
      }
      if (process.env.S3_BUCKET) {
        const response = await client().send(new GetObjectCommand({ Bucket: process.env.S3_BUCKET, Key: `${prefix}${key}` }));
        return Buffer.from(await response.Body!.transformToByteArray());
      }
      return readFile(path.join(directory(), key));
    },
    async remove(key: string) {
      safe(key);
      if (blobConfigured()) {
        await del(`${prefix}${key}`);
      } else if (process.env.S3_BUCKET) {
        await client().send(new DeleteObjectCommand({ Bucket: process.env.S3_BUCKET, Key: `${prefix}${key}` }));
      } else {
        await unlink(path.join(directory(), key)).catch((error) => {
          if (error.code !== "ENOENT") throw error;
        });
      }
    },
  };
}
export const galleryStorage = mediaStorage("uploads", "for-you/uploads/");
