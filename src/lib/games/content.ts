import "server-only";
import { mkdir, readFile, writeFile, rename } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { defaultGames } from "@/config/games";
import { gameConfigSchema, type GameConfig } from "./schemas";
import { db } from "@/lib/db";
const databaseStorage = () => process.env.DATABASE_PROVIDER === "postgresql" || !!process.env.VERCEL;
const databaseKey = "internal:games";
const file = () =>
  path.join(
    process.cwd(),
    ".data",
    process.env.NEXT_TEST_BUILD === "1" ? "games-test.json" : "games.json",
  );
export async function readGameConfig(): Promise<GameConfig> {
  if (databaseStorage()) {
    const stored = await db.featureSettings.findUnique({ where: { key: databaseKey } });
    if (!stored) return defaultGames;
    return gameConfigSchema.parse(JSON.parse(stored.configuration));
  }
  try {
    return gameConfigSchema.parse(JSON.parse(await readFile(file(), "utf8")));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT")
      console.error("Invalid playground content; using validated defaults.");
    return defaultGames;
  }
}
export async function saveGameConfig(config: GameConfig) {
  if (databaseStorage()) {
    const configuration = JSON.stringify(gameConfigSchema.parse(config));
    await db.featureSettings.upsert({
      where: { key: databaseKey },
      create: { key: databaseKey, enabled: false, configuration },
      update: { configuration },
    });
    return;
  }
  await mkdir(path.dirname(file()), { recursive: true });
  const temporary = `${file()}.${randomUUID()}.tmp`;
  await writeFile(
    temporary,
    JSON.stringify(gameConfigSchema.parse(config), null, 2),
    "utf8",
  );
  await rename(temporary, file());
}
