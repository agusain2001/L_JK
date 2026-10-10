import { spawnSync } from "node:child_process";
const env = { ...process.env, DATABASE_URL: "file:./storage-test.db", DATABASE_PROVIDER: "sqlite", NEXT_TEST_BUILD: "1", VERCEL: "", S3_BUCKET: "", BLOB_READ_WRITE_TOKEN: "", BLOB_STORE_ID: "" };
for (const args of [
  ["scripts/setup-db.mjs"],
  ["--conditions=react-server", "--import", "tsx", "--test", "tests/storage.test.ts"],
]) {
  const result = spawnSync(process.execPath, args, { stdio: "inherit", env });
  if (result.status !== 0) process.exit(result.status ?? 1);
}
