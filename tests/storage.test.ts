import { test, after } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { mediaStorage } from "../src/lib/media-storage";
import { privateStorage } from "../src/lib/world/storage";
import { readGameConfig, saveGameConfig } from "../src/lib/games/content";
import { db } from "../src/lib/db";
import { defaultGames } from "../src/config/games";
if (process.env.DATABASE_URL !== "file:./storage-test.db")
  throw new Error("Storage tests must use their isolated database.");
after(async () => { await db.$disconnect(); });
test("local media persists byte-for-byte and rejects traversal", async () => {
  const storage = mediaStorage("storage", "for-you/test/");
  const key = `${randomUUID()}.jpg`;
  const bytes = Buffer.from("a small isolated storage fixture");
  try {
    await storage.put(key, bytes, "image/jpeg");
    assert.deepEqual(await storage.read(key), bytes);
    await assert.rejects(storage.read("../auth-secret"), /Invalid media key/);
    await storage.remove(key);
    await assert.rejects(storage.read(key), { code: "ENOENT" });
  } finally { await storage.remove(key); }
});
test("Vercel refuses ephemeral uploads without cloud storage", async () => {
  process.env.VERCEL = "1";
  try {
    await assert.rejects(mediaStorage("storage", "for-you/test/").put("refused.png", Buffer.from("fixture"), "image/png"), /Configure private Blob or S3/);
  } finally { process.env.VERCEL = ""; }
});
test("generated demo audio remains playable without local or cloud media", async () => {
  const bytes = await privateStorage.read("demo-chime.wav");
  assert.equal(bytes.toString("ascii", 0, 4), "RIFF");
  assert.equal(bytes.toString("ascii", 8, 12), "WAVE");
  assert.equal(bytes.readUInt32LE(24), 44100);
  assert.equal(bytes.readUInt16LE(22), 1);
  assert.equal(bytes.readUInt32LE(40), 2 * 44100 * 2);
  assert.equal(bytes.length, 44 + bytes.readUInt32LE(40));
  assert.ok(bytes.readInt16LE(46) > 0);
});
test("serverless playground edits persist in the shared database", async () => {
  process.env.VERCEL = "1";
  try {
    await db.featureSettings.deleteMany({ where: { key: "internal:games" } });
    assert.deepEqual(await readGameConfig(), defaultGames);
    const config = structuredClone(defaultGames);
    config.quizQuestions[0].question = "A saved database question";
    await saveGameConfig(config);
    const stored = await db.featureSettings.findUniqueOrThrow({ where: { key: "internal:games" } });
    assert.equal(stored.enabled, false);
    assert.equal(JSON.parse(stored.configuration).quizQuestions[0].question, config.quizQuestions[0].question);
    assert.deepEqual(await readGameConfig(), config);
  } finally {
    process.env.VERCEL = "";
    await db.featureSettings.deleteMany({ where: { key: "internal:games" } });
  }
});
