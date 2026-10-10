import "server-only";
import { mkdir, readFile, writeFile, rename } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { defaultGames } from "@/config/games";
import { gameConfigSchema, type GameConfig } from "./schemas";
const file = () =>
  path.join(
    process.cwd(),
    ".data",
    process.env.NEXT_TEST_BUILD === "1" ? "games-test.json" : "games.json",
  );
export async function readGameConfig(): Promise<GameConfig> {
  try {
    return gameConfigSchema.parse(JSON.parse(await readFile(file(), "utf8")));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT")
      console.error("Invalid playground content; using validated defaults.");
    return defaultGames;
  }
}
export async function saveGameConfig(config: GameConfig) {
  await mkdir(path.dirname(file()), { recursive: true });
  const temporary = `${file()}.${randomUUID()}.tmp`;
  await writeFile(
    temporary,
    JSON.stringify(gameConfigSchema.parse(config), null, 2),
    "utf8",
  );
  await rename(temporary, file());
}
