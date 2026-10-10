import "server-only";
import { mkdir, readFile, writeFile, unlink } from "node:fs/promises";
import path from "node:path";
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
const directory = () =>
  path.join(
    process.cwd(),
    ".data",
    process.env.NEXT_TEST_BUILD === "1" ? "world-media-test" : "world-media",
  );
function safe(key: string) {
  if (!/^[a-zA-Z0-9_.-]{1,100}$/.test(key) || key.includes(".."))
    throw new Error("Invalid media key.");
  return key;
}
const client = () =>
  new S3Client({
    region: process.env.S3_REGION || "us-east-1",
    ...(process.env.S3_ENDPOINT
      ? { endpoint: process.env.S3_ENDPOINT, forcePathStyle: true }
      : {}),
  });
export const privateStorage = {
  async put(key: string, bytes: Buffer, mime: string) {
    safe(key);
    if (process.env.S3_BUCKET) {
      await client().send(
        new PutObjectCommand({
          Bucket: process.env.S3_BUCKET,
          Key: `for-you/${key}`,
          Body: bytes,
          ContentType: mime,
        }),
      );
      return;
    }
    await mkdir(directory(), { recursive: true });
    await writeFile(path.join(directory(), key), bytes);
  },
  async read(key: string) {
    safe(key);
    if (process.env.S3_BUCKET && !key.startsWith("demo-")) {
      const response = await client().send(
        new GetObjectCommand({
          Bucket: process.env.S3_BUCKET,
          Key: `for-you/${key}`,
        }),
      );
      return Buffer.from(await response.Body!.transformToByteArray());
    }
    return readFile(path.join(directory(), key));
  },
  async remove(key: string) {
    safe(key);
    if (process.env.S3_BUCKET && !key.startsWith("demo-")) {
      await client().send(
        new DeleteObjectCommand({
          Bucket: process.env.S3_BUCKET,
          Key: `for-you/${key}`,
        }),
      );
      return;
    }
    await unlink(path.join(directory(), key)).catch((error) => {
      if (error.code !== "ENOENT") throw error;
    });
  },
};
