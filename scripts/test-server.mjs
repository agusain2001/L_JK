import { spawn } from "node:child_process";
import { spawnSync } from "node:child_process";
import { rmSync } from "node:fs";
import { PrismaClient } from "@prisma/client";
// Only the isolated test content file is reset; real studio content is untouched.
rmSync(".data/games-test.json", { force: true });
const setup = spawnSync(process.execPath, ["scripts/setup-db.mjs"], {
  stdio: "inherit",
  env: process.env,
});
if (setup.status !== 0) process.exit(setup.status ?? 1);
if (
  process.env.DATABASE_URL !== "file:./test.db" ||
  process.env.NEXT_TEST_BUILD !== "1"
)
  throw new Error(
    "The browser test server must use its isolated test database.",
  );
const testDb = new PrismaClient();
for (const model of [
  "capsuleOpening",
  "contentAttachment",
  "contentMemory",
  "locationMemory",
  "timeCapsule",
  "worldContent",
  "memoryLocation",
  "photoBoothCreation",
  "mediaAsset",
  "keepsake",
  "rewardUnlock",
  "gameProgress",
  "privateMessage",
  "gardenFlower",
  "bucketListItem",
  "invitation",
  "session",
  "account",
  "verification",
  "user",
  "featureSettings",
  "requestLimit",
])
  await testDb[model].deleteMany();
await testDb.$disconnect();
const server = spawn(
  process.execPath,
  [
    "node_modules/next/dist/bin/next",
    "dev",
    "--hostname",
    "127.0.0.1",
    "--port",
    "3001",
  ],
  { stdio: "inherit", env: process.env },
);
process.on("SIGTERM", () => server.kill());
process.on("SIGINT", () => server.kill());
server.on("exit", (code) => process.exit(code ?? 0));
