import { test, expect, type Page } from "./fixtures";
import { defaultGames } from "../src/config/games";
import { readFile } from "node:fs/promises";
import sharp from "sharp";
const key = "for-you-little-surprises:v1";
async function play(page: Page, name: string) {
  await page.locator(".game-preview-grid").hover();
  await page.getByRole("button", { name: `Play ${name}`, exact: true }).click();
  await expect(page.locator(".game-stage")).toBeVisible();
}
async function exit(page: Page) {
  await page
    .getByRole("button", { name: "Exit to games menu", exact: true })
    .click();
  await expect(page.locator(".game-preview")).toHaveCount(6);
}
test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/#games");
  await page.locator("#games").scrollIntoViewIfNeeded();
});
test("six games are integrated, keyboard quiz works, subjective answers do not reduce the fact score", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await expect(page.locator(".game-preview")).toHaveCount(6);
  await play(page, "Kitna jaanti ho humein?");
  for (let i = 0; i < 8; i++) {
    const answer = page.locator(".answer-list button").first();
    await answer.focus();
    await page.keyboard.press("Enter");
    await expect(page.locator(".answer-feedback")).not.toBeEmpty();
    await page
      .getByRole("button", {
        name: i === 7 ? "See my little surprise" : "Next question",
        exact: true,
      })
      .click();
  }
  await expect(page.locator(".game-completion")).toContainText(
    "2 of 2 fact-based questions",
  );
  await expect(page.locator(".game-completion")).toContainText(
    "meri favourite toh tum hi ho",
  );
  await page.getByRole("button", { name: "Play again", exact: true }).click();
  await expect(page.locator(".game-kicker")).toContainText("Question 1 of 8");
  await exit(page);
  await page.reload();
  await page.locator(".little-surprises summary").click();
  await expect(page.locator(".surprise-record")).toContainText(
    "Highest quiz score: 2 of 2 facts",
  );
  expect(errors).toEqual([]);
});
test("memory matching locks a mismatch, ignores extra flips, and completes all six pairs", async ({
  page,
}) => {
  await play(page, "Yaadon ki jodi banao");
  const cards = page.locator(".match-card");
  await expect(cards).toHaveCount(12);
  const sources = await cards
    .locator("img")
    .evaluateAll((images) => images.map((i) => (i as HTMLImageElement).src));
  const second = sources.findIndex((s, i) => i > 0 && s !== sources[0]);
  const third = sources.findIndex((_, i) => i !== 0 && i !== second);
  await cards.nth(0).click();
  await cards.nth(second).click();
  await cards.nth(third).click();
  await expect(page.locator(".match-card.flipped")).toHaveCount(2);
  await expect(page.locator(".match-card.flipped")).toHaveCount(0, {
    timeout: 4000,
  });
  const groups = new Map<string, number[]>();
  sources.forEach((src, i) => groups.set(src, [...(groups.get(src) || []), i]));
  for (const pair of groups.values()) {
    await cards.nth(pair[0]).click();
    await cards.nth(pair[1]).click();
  }
  await expect(page.locator(".game-completion")).toContainText(
    "7 turns · 6 pairs",
  );
  await expect(page.locator(".game-completion")).toContainText(
    "Saari photos match ho gayi",
  );
  await page.getByRole("button", { name: "Restart game", exact: true }).click();
  await expect(page.locator(".match-card")).toHaveCount(12);
  await expect(page.locator(".game-kicker")).toContainText("0 turns");
  const progress = await page.evaluate(
    (k) => JSON.parse(localStorage.getItem(k)!),
    key,
  );
  expect(Object.values(progress.matchedPairsBest)).toEqual([7]);
});
test("hidden hearts deduplicate, accessible trail unlocks reward only at completion and survives refresh", async ({
  page,
}) => {
  await play(page, "Mera dil dhoondo");
  await expect(
    page.getByRole("button", { name: "Open your heart reward", exact: true }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "Find note 1", exact: true }).click();
  await expect(page.getByRole("dialog")).toContainText(
    "Meri smile ki ek wajah? Tum",
  );
  await page.keyboard.press("Escape");
  await page
    .getByRole("button", { name: "Reopen note 1", exact: true })
    .click();
  await page.keyboard.press("Escape");
  await expect(page.locator(".heart-hunt .game-kicker")).toHaveText(
    "1 of 7 little hearts found ♡",
  );
  for (let i = 2; i <= 7; i++) {
    await page
      .getByRole("button", { name: `Find note ${i}`, exact: true })
      .click();
    await page.keyboard.press("Escape");
  }
  await page
    .getByRole("button", { name: "Open your heart reward", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toContainText(
    "mera favourite toh tumhara hi tha",
  );
  await page.keyboard.press("Escape");
  await page.reload();
  await play(page, "Mera dil dhoondo");
  await expect(page.locator(".heart-hunt .game-kicker")).toContainText(
    "7 of 7",
  );
  await expect(
    page.getByRole("button", { name: "Open your heart reward", exact: true }),
  ).toBeVisible();
});
test("a heart hidden in the actual story reveals a note and opens the same progress", async ({
  page,
}) => {
  const target = page.getByRole("button", {
    name: "Find hidden heart in garden",
    exact: true,
  });
  await target.click();
  await expect(page.getByRole("dialog")).toContainText("tum jaisi ho, bahut pyaari ho");
  await page.keyboard.press("Escape");
  await page.locator(".heart-trail-progress").click();
  await expect(page.locator(".heart-hunt .game-kicker")).toContainText(
    "1 of 7",
  );
});
test("bouquet supports touch controls, limit, reorder, wrapping, storage and actual PNG export", async ({
  page,
}) => {
  await play(page, "Princess ka bouquet");
  await page
    .getByRole("button", { name: "Add Daisy color 1", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Add Tulip color 1", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Add Rose color 1", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Move flower 3 earlier", exact: true })
    .click();
  await expect(page.locator(".bouquet-picked li").nth(1)).toContainText("Rose");
  await page
    .getByRole("button", { name: "Remove flower 1", exact: true })
    .click();
  for (let i = 0; i < 5; i++)
    await page
      .getByRole("button", { name: "Add Wildflower color 1", exact: true })
      .click();
  await expect(
    page.getByRole("button", { name: "Add Daisy color 1", exact: true }),
  ).toBeDisabled();
  await page.getByLabel("Arrangement", { exact: true }).selectOption("cascade");
  await page.getByLabel("Paper wrapping", { exact: true }).selectOption("sage");
  await page.getByLabel("Ribbon color", { exact: true }).selectOption("blue");
  await page.getByLabel("Your little note").fill("A tiny bouquet, with love.");
  await page
    .getByRole("button", { name: "Wrap my bouquet", exact: true })
    .click();
  const download = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Save postcard as PNG", exact: true })
    .click();
  const file = await download;
  expect(file.suggestedFilename()).toBe("a-bouquet-for-you.png");
  const bytes = await readFile((await file.path())!);
  expect([...bytes.subarray(0, 8)]).toEqual([137, 80, 78, 71, 13, 10, 26, 10]);
  const metadata = await sharp(bytes).metadata();
  expect(metadata.width).toBe(900);
  expect(metadata.height).toBe(1050);
  await page
    .getByRole("button", { name: "Keep bouquet in this browser", exact: true })
    .click();
  await expect(
    page.getByRole("status").filter({ hasText: "kept in this browser" }),
  ).toBeVisible();
  await exit(page);
  await page.reload();
  await play(page, "Princess ka bouquet");
  await page
    .getByRole("button", { name: "Restore my last bouquet", exact: true })
    .click();
  await expect(page.locator(".bouquet-picked li")).toHaveCount(7);
  await expect(page.getByLabel("Your little note")).toHaveValue(
    "A tiny bouquet, with love.",
  );
});
test("desktop drag can add a flower and keyboard removal remains available", async ({
  page,
}, testInfo) => {
  test.skip(
    testInfo.project.name === "mobile",
    "Phone interaction uses the tap controls tested above.",
  );
  await play(page, "Princess ka bouquet");
  await page
    .getByRole("button", { name: "Add Rose color 1", exact: true })
    .dragTo(page.locator(".bouquet-art"));
  await expect(page.locator(".bouquet-picked li")).toHaveCount(1);
  await page
    .getByRole("button", { name: "Add Daisy color 1", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Add Tulip color 1", exact: true })
    .click();
  await page
    .locator(".bouquet-picked li")
    .nth(2)
    .locator("span")
    .dragTo(page.locator(".bouquet-picked li").first());
  await expect(page.locator(".bouquet-picked li").first()).toContainText(
    "Tulip",
  );
  const remove = page.getByRole("button", {
    name: "Remove flower 1",
    exact: true,
  });
  await remove.focus();
  await page.keyboard.press("Enter");
  await expect(page.locator(".bouquet-picked li")).toHaveCount(2);
});
test("configured guessing clues reduce blur, wrong answers do not reveal, and replay uses another photo", async ({
  page,
}) => {
  await play(page, "Yeh kaunsi yaad hai?");
  const photo = page.locator(".guess-image img");
  await expect(photo).toHaveAttribute("src", "/images/memory-3.webp");
  await page
    .getByRole("button", { name: "Where the sky meets the sea", exact: true })
    .click();
  await expect(page.locator(".guess-polaroid")).not.toHaveClass(/revealed/);
  const blur = await photo.evaluate((e) => getComputedStyle(e).filter);
  await page
    .getByRole("button", { name: "One more clue", exact: true })
    .click();
  expect(await photo.evaluate((e) => getComputedStyle(e).filter)).not.toEqual(
    blur,
  );
  await page
    .getByRole("button", { name: "Something beautiful", exact: true })
    .click();
  await expect(page.locator(".guess-polaroid")).toHaveClass(/revealed/);
  await expect(photo).toHaveAttribute("alt", "Something beautiful");
  await page
    .getByRole("button", { name: "Another little memory", exact: true })
    .click();
  await expect(photo).toHaveAttribute("src", "/images/memory-4.webp");
  await page
    .getByRole("button", { name: "Reveal the answer", exact: true })
    .click();
  await expect(page.locator(".guess-note")).toContainText("sample photograph");
  expect(
    (await page.evaluate((k) => JSON.parse(localStorage.getItem(k)!), key))
      .discoveredMemoryIds,
  ).toHaveLength(2);
});
test("adventure selections make a downloadable PNG, can be adjusted, and remembered with explicit control", async ({
  page,
}) => {
  await play(page, "Agla plan kya hai?");
  for (let i = 0; i < 6; i++) {
    await page.locator(".adventure-option").nth(1).click();
    await page
      .getByRole("button", {
        name: i === 5 ? "Make our postcard" : "Next little choice",
        exact: true,
      })
      .click();
  }
  await expect(page.locator(".adventure-result h3")).toContainText(
    "sunset, beach, ice cream",
  );
  const downloading = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Download postcard", exact: true })
    .click();
  const download = await downloading;
  const metadata = await sharp(
    await readFile((await download.path())!),
  ).metadata();
  expect(metadata.width).toBe(1200);
  expect(metadata.height).toBe(850);
  await page
    .getByRole("button", { name: "Remember my choices", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Adjust my choices", exact: true })
    .click();
  await expect(page.locator(".adventure-option").nth(1)).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await exit(page);
  await page.reload();
  await play(page, "Agla plan kya hai?");
  await page
    .getByRole("button", { name: "Restore remembered choices", exact: true })
    .click();
  await expect(page.locator(".adventure-option").nth(1)).toHaveAttribute(
    "aria-pressed",
    "true",
  );
});
test("reset clears earned rewards, corrupt storage recovers, games fit screen and reduced-motion flip is immediate", async ({
  page,
}) => {
  await play(page, "Mera dil dhoondo");
  await page.getByRole("button", { name: "Find note 1", exact: true }).click();
  await page.keyboard.press("Escape");
  await exit(page);
  await page.locator(".little-surprises summary").click();
  await page
    .getByRole("button", { name: "Reset my progress", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Yes, reset progress", exact: true })
    .click();
  await expect(page.locator(".surprise-record")).toContainText(
    "0 of 7 little hearts found",
  );
  await page.reload();
  await play(page, "Yaadon ki jodi banao");
  expect(
    await page
      .locator(".match-inner")
      .first()
      .evaluate((e) => getComputedStyle(e).transitionDuration),
  ).toBe("0s");
  expect(
    await page
      .locator(".game-stage")
      .evaluate((e) => e.scrollWidth <= innerWidth),
  ).toBe(true);
  await exit(page);
  await page.evaluate((k) => localStorage.setItem(k, "broken json"), key);
  await page.reload();
  await play(page, "Kitna jaanti ho humein?");
  await expect(page.locator(".quiz-paper")).toBeVisible();
});
test("studio edits validate content, never reference drafts, and publish availability and real question text", async ({
  page,
  baseURL,
}) => {
  await page.goto("/admin");
  await page
    .getByLabel("Studio password")
    .fill("test-only-studio-password-12345678");
  await page
    .getByRole("button", { name: "Open the studio", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Your playground studio.", exact: true }),
  ).toBeVisible();
  try {
    await page.getByRole("button", { name: "questions", exact: true }).click();
    const question = page.getByRole("group", {
      name: "Question 1",
      exact: true,
    });
    await question
      .getByLabel("Question text", { exact: true })
      .fill("Which little adventure sounds lovely today?");
    await page
      .getByRole("button", { name: "Save playground content", exact: true })
      .click();
    await expect(
      page.getByRole("status").filter({ hasText: "Playground content saved" }),
    ).toBeVisible();
    const invalid = structuredClone(defaultGames);
    invalid.puzzles[0].approvedMediaId = "unapproved-photo";
    const rejected = await page.request.put("/api/admin/games", {
      headers: { origin: baseURL! },
      data: invalid,
    });
    expect(rejected.status()).toBe(400);
    await page.goto("/#games");
    await play(page, "Kitna jaanti ho humein?");
    await expect(page.locator(".quiz-paper h3")).toHaveText(
      "Which little adventure sounds lovely today?",
    );
    const changed = structuredClone(defaultGames);
    changed.games.find((g) => g.id === "guess")!.enabled = false;
    expect(
      (
        await page.request.put("/api/admin/games", {
          headers: { origin: baseURL! },
          data: changed,
        })
      ).ok(),
    ).toBe(true);
    await page.reload();
    await expect(
      page.getByRole("button", { name: "Play Yeh kaunsi yaad hai?", exact: true }),
    ).toHaveCount(0);
  } finally {
    expect(
      (
        await page.request.put("/api/admin/games", {
          headers: { origin: baseURL! },
          data: defaultGames,
        })
      ).ok(),
    ).toBe(true);
  }
});
test("normal motion games preserve page scrolling and return to the story without runtime errors", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (e) => {
    if (e.type() === "error") errors.push(e.text());
  });
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/#games");
  await play(page, "Yaadon ki jodi banao");
  await page.locator(".game-stage").scrollIntoViewIfNeeded();
  await page.locator(".match-grid").hover();
  const before = await page.evaluate(() => scrollY);
  await page.mouse.wheel(0, 400);
  await expect
    .poll(() => page.evaluate(() => scrollY))
    .toBeGreaterThan(before + 50);
  await exit(page);
  const menu = page.getByRole("button", { name: "Open menu", exact: true });
  if (await menu.isVisible()) await menu.click();
  await page.getByRole("link", { name: "Gallery", exact: true }).click();
  await expect(page.locator("#gallery")).toBeInViewport();
  expect(errors).toEqual([]);
});

test("private game editing rejects anonymous and cross-origin requests", async ({
  request,
  baseURL,
}) => {
  expect((await request.get("/api/admin/games")).status()).toBe(401);
  expect(
    (await request.put("/api/admin/games", { data: defaultGames })).status(),
  ).toBe(401);
  await request.post("/api/admin/session", {
    headers: { origin: baseURL! },
    data: { password: "test-only-studio-password-12345678" },
  });
  expect(
    (
      await request.put("/api/admin/games", {
        headers: { origin: "https://example.org" },
        data: defaultGames,
      })
    ).status(),
  ).toBe(401);
});
