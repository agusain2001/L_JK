import { spawnSync } from "node:child_process";
const requirements = {
  DATABASE_PROVIDER: process.env.DATABASE_PROVIDER === "postgresql",
  DATABASE_URL: /^postgres(ql)?:\/\//.test(process.env.DATABASE_URL || ""),
  BETTER_AUTH_SECRET: (process.env.BETTER_AUTH_SECRET || "").length >= 32,
  BETTER_AUTH_URL: /^https:\/\//.test(process.env.BETTER_AUTH_URL || ""),
  "private Blob or S3 storage": !!(process.env.BLOB_READ_WRITE_TOKEN || process.env.BLOB_STORE_ID || process.env.S3_BUCKET),
};
const missing = Object.entries(requirements).filter(([, valid]) => !valid).map(([name]) => name);
if (missing.length) {
  console.error(`Configure these Vercel settings before deploying: ${missing.join(", ")}. See VERCEL.md.`);
  process.exit(1);
}
for (const args of [
  ["scripts/generate-client.mjs"],
  ["node_modules/prisma/build/index.js", "migrate", "deploy", "--schema", "prisma/postgresql/schema.prisma"],
  ["node_modules/next/dist/bin/next", "build"],
]) {
  const env = args.includes("migrate") && process.env.DATABASE_URL_UNPOOLED
    ? { ...process.env, DATABASE_URL: process.env.DATABASE_URL_UNPOOLED }
    : process.env;
  const result = spawnSync(process.execPath, args, { stdio: "inherit", env });
  if (result.status !== 0) process.exit(result.status ?? 1);
}
