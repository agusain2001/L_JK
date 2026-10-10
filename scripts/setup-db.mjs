import { DatabaseSync } from "node:sqlite";
import { existsSync, mkdirSync } from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
if (existsSync(".env")) process.loadEnvFile(".env");
const url = process.env.DATABASE_URL || "file:./dev.db";
process.env.DATABASE_URL = url;
if (url.startsWith("file:")) {
  const file = path.resolve("prisma", url.slice(5));
  mkdirSync(path.dirname(file), { recursive: true });
  // Creating the empty file first also supports Windows Prisma schema engine initialization.
  new DatabaseSync(file).close();
}
const result = spawnSync(
  process.execPath,
  ["node_modules/prisma/build/index.js", "migrate", "deploy"],
  { stdio: "inherit", env: process.env },
);
process.exit(result.status ?? 1);
