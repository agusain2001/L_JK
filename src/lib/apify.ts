import "server-only";
import { ApifyClient } from "apify-client";
import { readFile } from "node:fs/promises";
import { db } from "./db";
import { normalizeImport } from "./validation";
export async function syncApify(
  mode: "dataset" | "task" | "actor",
  datasetOverride?: string,
) {
  if (!process.env.APIFY_API_TOKEN)
    throw new Error("Add APIFY_API_TOKEN to your environment first.");
  const client = new ApifyClient({
    token: process.env.APIFY_API_TOKEN,
    maxRetries: 2,
  });
  let datasetId = datasetOverride || process.env.APIFY_DATASET_ID;
  if (mode === "task") {
    if (!process.env.APIFY_TASK_ID)
      throw new Error("Configure APIFY_TASK_ID first.");
    const run = await client
      .task(process.env.APIFY_TASK_ID)
      .call(undefined, { waitSecs: 60 });
    if (!run || run.status !== "SUCCEEDED")
      throw new Error(
        "Task did not finish successfully. Wait for completion and sync its dataset.",
      );
    datasetId = run.defaultDatasetId;
  }
  if (mode === "actor") {
    if (
      !process.env.APIFY_ACTOR_ID ||
      !process.env.APIFY_ACTOR_INPUT_FILE ||
      process.env.APIFY_ACTOR_SCHEMA_VERIFIED !== "true"
    )
      throw new Error(
        "Inspect your selected Actor input schema and configure a verified input file before running it.",
      );
    const input = JSON.parse(
      await readFile(process.env.APIFY_ACTOR_INPUT_FILE, "utf8"),
    ) as Record<string, unknown>;
    const run = await client
      .actor(process.env.APIFY_ACTOR_ID)
      .call(input, { waitSecs: 60 });
    if (!run || run.status !== "SUCCEEDED")
      throw new Error(
        "Actor did not finish successfully. Sync its dataset after it completes.",
      );
    datasetId = run.defaultDatasetId;
  }
  if (!datasetId) throw new Error("Configure APIFY_DATASET_ID first.");
  const items: unknown[] = [];
  let offset = 0;
  while (offset < 1000) {
    const page = await client
      .dataset(datasetId)
      .listItems({ offset, limit: 100 });
    items.push(...page.items);
    offset += page.items.length;
    if (!page.items.length || offset >= page.total) break;
  }
  const { accepted, rejected } = normalizeImport(items);
  let imported = 0;
  for (const media of accepted) {
    const exists = await db.memory.findUnique({
      where: { mediaUrl: media.mediaUrl },
    });
    if (exists) continue;
    await db.memory.create({
      data: { ...media, tags: JSON.stringify(media.tags), approved: false },
    });
    imported++;
  }
  return {
    imported,
    rejected,
    scanned: items.length,
    message: `${imported} new memories saved for review. ${rejected} unsupported records skipped.`,
  };
}
