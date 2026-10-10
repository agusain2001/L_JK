import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
const folder = "prisma/postgresql";
mkdirSync(folder, { recursive: true });
const source = readFileSync("prisma/schema.prisma", "utf8");
writeFileSync(
  `${folder}/schema.prisma`,
  source.replace('provider = "sqlite"', 'provider = "postgresql"'),
);
const migration = `${folder}/migrations/20261009220000_initial_world/migration.sql`;
if (!existsSync(migration)) {
  mkdirSync(`${folder}/migrations/20261009220000_initial_world`, {
    recursive: true,
  });
  writeFileSync(
    `${folder}/migrations/migration_lock.toml`,
    'provider = "postgresql"\n',
  );
  const result = spawnSync(
    process.execPath,
    [
      "node_modules/prisma/build/index.js",
      "migrate",
      "diff",
      "--from-empty",
      "--to-schema-datamodel",
      `${folder}/schema.prisma`,
      "--script",
      "--output",
      migration,
    ],
    { stdio: "inherit", env: process.env },
  );
  if (result.status !== 0) process.exit(result.status ?? 1);
}
console.log(
  "PostgreSQL schema prepared. Existing migrations were preserved; create a new migration for future schema changes.",
);
