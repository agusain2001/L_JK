import { test } from "node:test";
import assert from "node:assert/strict";
import { normalizeImport, memoryInput, mediaUrl } from "../src/lib/validation";
import { defaultGames } from "../src/config/games";
import {
  availableConfig,
  collectHeart,
  matchDeck,
  quizScore,
  keepQuizBest,
  shuffle,
} from "../src/lib/games/engines";
import {
  emptyProgress,
  gameConfigSchema,
  progressSchema,
} from "../src/lib/games/schemas";
import { demoMemories } from "../src/config/story";
import { bouquetPostcard, adventurePostcard } from "../src/lib/games/postcards";
import { gameStorageKey } from "../src/lib/games/storage";
test("signed-in game drafts have separate browser keys for each user", () => {
  assert.notEqual(gameStorageKey("reader-a"), gameStorageKey("reader-b"));
  assert.notEqual(gameStorageKey("reader-a"), gameStorageKey());
  assert.equal(gameStorageKey(), "for-you-little-surprises:v1");
});
import {
  calendarDay,
  occurrence,
  deterministicIndex,
  visibleCoordinates,
} from "../src/lib/world/dates";
import { chooseDaily } from "../src/lib/world/daily";
import {
  contentSchema,
  locationSchema,
  settingsSchema,
  type WorldContent,
} from "../src/lib/world/schemas";
test("world dates use calendar timezone boundaries and define leap anniversaries", () => {
  assert.equal(
    calendarDay(new Date("2026-10-09T20:00:00Z"), "Asia/Kolkata"),
    "2026-10-10",
  );
  assert.equal(
    calendarDay(new Date("2026-10-09T20:00:00Z"), "America/Los_Angeles"),
    "2026-10-09",
  );
  assert.equal(occurrence("2024-02-29", true, "2026-02-20"), "2026-02-28");
  assert.equal(occurrence("2024-02-29", true, "2027-03-01"), "2028-02-29");
  assert.equal(occurrence("2024-02-29", false, "2027-03-01"), "2024-02-29");
});
test("map precision is removed or rounded on the server", () => {
  const place = {
    latitude: 28.613955,
    longitude: 77.209133,
    precision: "hidden",
  };
  assert.deepEqual(visibleCoordinates(place), {
    latitude: null,
    longitude: null,
  });
  assert.deepEqual(visibleCoordinates({ ...place, precision: "city" }), {
    latitude: 28.6,
    longitude: 77.2,
  });
  assert.deepEqual(visibleCoordinates({ ...place, precision: "approximate" }), {
    latitude: 28.61,
    longitude: 77.21,
  });
});
test("daily note overrides, rotation, feature validation and future exclusions are deterministic", () => {
  const entry = (
    id: string,
    extra: Partial<WorldContent> = {},
  ): WorldContent => ({
    id,
    kind: "today",
    title: id,
    body: id,
    audience: "public",
    description: "",
    enabled: true,
    demo: false,
    color: "cream",
    displayOrder: 0,
    date: null,
    recurring: false,
    featured: false,
    metadata: {},
    memoryIds: [],
    assets: [],
    ...extra,
  });
  const pool = [
    entry("regular"),
    entry("future", { date: "2099-01-01" }),
    entry("featured", { featured: true }),
    entry("override", { date: "2026-10-09" }),
  ];
  assert.equal(chooseDaily(pool, "2026-10-09")?.id, "override");
  assert.equal(chooseDaily(pool, "2026-10-10")?.id, "featured");
  assert.equal(chooseDaily(pool.slice(0, 2), "2026-10-10")?.id, "regular");
  assert.equal(
    deterministicIndex("2026-10-09", 7),
    deterministicIndex("2026-10-09", 7),
  );
  assert.equal(
    contentSchema.safeParse({
      kind: "capsules",
      title: "Letter",
      unlockAt: "tomorrow",
    }).success,
    false,
  );
  assert.equal(
    contentSchema.safeParse({
      kind: "dates",
      title: "Date",
      date: "2026-02-30",
    }).success,
    false,
  );
  assert.equal(
    locationSchema.safeParse({
      title: "Place",
      latitude: 92,
      longitude: 70,
      precision: "city",
    }).success,
    false,
  );
  assert.equal(
    settingsSchema.safeParse({ timeZone: "Invented/Zone" }).success,
    false,
  );
});
test("long custom adventure choices expand the postcard without dropping selected text", () => {
  const choices = Array.from(
    { length: 12 },
    (_, i) =>
      `A long beautiful adventure choice number ${i + 1}, somewhere special`,
  );
  const postcard = adventurePostcard(choices.join(", "), choices);
  assert.ok(Number(postcard.match(/height="(\d+)"/)?.[1]) > 850);
  assert.match(postcard, /number 12/);
  assert.match(postcard, /somewhere special/);
});
test("highest quiz score survives repeated lower scores and opinion-only rounds", () => {
  let results = [{ score: 2, total: 2 }];
  for (let i = 0; i < 25; i++)
    results = keepQuizBest(results, { score: 0, total: 2 });
  results = keepQuizBest(results, { score: 0, total: 0 });
  assert.equal(results.length, 20);
  assert.deepEqual(results[0], { score: 2, total: 2 });
});
test("quiz opinions are not scored, and configured facts determine the score", () => {
  const answers = Object.fromEntries(
    defaultGames.quizQuestions.map((q) => [
      q.id,
      q.correctAnswerId || q.options[0].id,
    ]),
  );
  assert.deepEqual(quizScore(defaultGames.quizQuestions, answers), {
    score: 2,
    total: 2,
  });
  answers["sample-caption"] = "sea";
  assert.deepEqual(quizScore(defaultGames.quizQuestions, answers), {
    score: 1,
    total: 2,
  });
  assert.deepEqual(
    quizScore(
      defaultGames.quizQuestions.filter((q) => !q.correctAnswerId),
      answers,
    ),
    { score: 0, total: 0 },
  );
});
test("Fisher-Yates keeps every card, does not mutate input, and decks have two of each image", () => {
  const original = [1, 2, 3, 4];
  assert.deepEqual(
    shuffle(original, () => 0),
    [2, 3, 4, 1],
  );
  assert.deepEqual(original, [1, 2, 3, 4]);
  const deck = matchDeck(demoMemories);
  assert.equal(deck.length, 12);
  for (const m of demoMemories)
    assert.equal(deck.filter((c) => c.pair === m.id).length, 2);
  assert.equal(matchDeck(demoMemories.slice(0, 2)).length, 4);
});
test("hearts deduplicate, reject unknown targets, and reward only complete collection", () => {
  let progress = emptyProgress();
  progress = collectHeart(progress, "heart-1", defaultGames);
  progress = collectHeart(progress, "heart-1", defaultGames);
  assert.equal(progress.collectedHeartIds.length, 1);
  assert.equal(collectHeart(progress, "unknown", defaultGames), progress);
  assert.equal(progress.completedGameIds.includes("hearts"), false);
  for (const h of defaultGames.hearts)
    progress = collectHeart(progress, h.id, defaultGames);
  assert.equal(progress.completedGameIds.includes("hearts"), true);
});
test("playground media never includes unpublished or unavailable references", () => {
  const media = [{ ...demoMemories[2], demo: false, approved: false }];
  assert.equal(availableConfig(defaultGames, media).puzzles.length, 0);
  assert.equal(matchDeck(media).length, 0);
  const filtered = availableConfig(defaultGames, [demoMemories[2]]);
  assert.equal(filtered.puzzles.length, 1);
  assert.equal(filtered.quizQuestions.filter((q) => q.imageId).length, 1);
});
test("editable game schemas reject wrong answers, duplicate IDs, and invalid versions", () => {
  const config = structuredClone(defaultGames);
  config.puzzles[0].correctAnswerId = "missing";
  assert.equal(gameConfigSchema.safeParse(config).success, false);
  const duplicates = structuredClone(defaultGames);
  duplicates.games[1].id = duplicates.games[0].id;
  assert.equal(gameConfigSchema.safeParse(duplicates).success, false);
  assert.equal(
    progressSchema.safeParse({ ...emptyProgress(), version: 2 }).success,
    false,
  );
});
test("postcard notes are escaped and selected flowers, wrap, ribbon appear in export", () => {
  const svg = bouquetPostcard({
    flowers: [{ id: "flower-1", type: "rose", color: "#d78d9c" }],
    wrap: "sage",
    ribbon: "blue",
    arrangement: "fan",
    note: "A <little> & lovely note",
  });
  assert.match(svg, /&lt;little&gt; &amp;/);
  assert.match(svg, /#d78d9c/);
  assert.match(svg, /#bdc9ad/);
  assert.match(svg, /#8ba9c0/);
  assert.doesNotMatch(svg, /<little>/);
});
test("imports are validated, deduplicated, and never automatically approved", () => {
  const result = normalizeImport([
    { mediaUrl: "https://example.com/one.jpg", approved: true },
    { mediaUrl: "https://example.com/one.jpg" },
    { mediaUrl: "javascript:alert(1)" },
    { hello: "world" },
  ]);
  assert.equal(result.accepted.length, 1);
  assert.equal(result.accepted[0].approved, false);
  assert.equal(result.rejected, 2);
});
test("video memories require posters", () => {
  assert.equal(
    memoryInput.safeParse({
      kind: "video",
      mediaUrl: "https://example.com/video.mp4",
    }).success,
    false,
  );
  assert.equal(
    memoryInput.safeParse({
      kind: "video",
      mediaUrl: "https://example.com/video.mp4",
      thumbnailUrl: "https://example.com/poster.jpg",
    }).success,
    true,
  );
});
test("media rejects active schemes, private addresses, and arbitrary local paths", () => {
  for (const url of [
    "javascript:alert(1)",
    "http://example.com/photo.jpg",
    "https://127.0.0.1/private",
    "https://192.168.1.1/photo",
    "/../../secret",
    ".env",
    "https://user:password@example.com/photo",
  ])
    assert.equal(mediaUrl.safeParse(url).success, false, url);
});
test("approved upload paths and HTTPS media are supported", () => {
  assert.equal(mediaUrl.safeParse("/uploads/abc123-456.jpg").success, true);
  assert.equal(
    mediaUrl.safeParse("https://example.com/photo.jpg").success,
    true,
  );
});
test("oversized metadata and invalid ordering are rejected", () => {
  assert.equal(
    memoryInput.safeParse({
      mediaUrl: "https://example.com/photo.jpg",
      caption: "x".repeat(201),
    }).success,
    false,
  );
  assert.equal(
    memoryInput.safeParse({
      mediaUrl: "https://example.com/photo.jpg",
      order: -1,
    }).success,
    false,
  );
});
