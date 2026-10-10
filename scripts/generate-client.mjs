import { existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
if (existsSync(".env")) process.loadEnvFile(".env");
const schema = process.env.DATABASE_PROVIDER === "postgresql"
  ? "prisma/postgresql/schema.prisma" : "prisma/schema.prisma";
const result = spawnSync(process.execPath,
  ["node_modules/prisma/build/index.js", "generate", "--schema", schema],
  { stdio: "inherit", env: process.env });
process.exit(result.status ?? 1);
