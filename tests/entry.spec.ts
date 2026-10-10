import { test, expect, type Page } from "@playwright/test";
const sessionKey = "for-you:tulip-walk:v3";
const garden = (page: Page) => page.getByRole("region", { name: "Princess ki tulip walk" });
async function walk(page: Page) {
  await page.getByRole("button", { name: "Haan, chalo", exact: true }).click();
  await expect(garden(page)).toHaveAttribute("data-stage", "1");
}
async function pick(page: Page, color = "Pink wala") {
  await page.getByRole("button", { name: color, exact: true }).click();
  await page.getByRole("button", { name: "Yeh wala, ab aage chalo", exact: true }).click();
  await expect(garden(page)).toHaveAttribute("data-stage", "2");
}

test("princess walks through tulips without a name form; selection, reveal, session and replay work", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
  await page.goto("/");
  await expect(garden(page)).toHaveAttribute("data-stage", "0");
  await expect(page.locator(".entry-sculpture, .paper-tulip-garden")).toHaveCount(0);
  await expect(garden(page).locator("input, textarea")).toHaveCount(0);
  await expect(page.locator(".story-experience")).toHaveCount(0);
  await expect(page.locator(".garden-entry-copy h1")).toContainText("Chalo, Rashika.");
  await walk(page);
  await expect(page.locator(".garden-entry-next")).toBeDisabled();
  await page.getByRole("button", { name: "Pink wala", exact: true }).click();
  await expect(page.locator(".garden-entry-reply")).toContainText("Cute choice");
  await page.getByRole("button", { name: "Cream wala", exact: true }).click();
  await expect(page.getByRole("button", { name: "Cream wala", exact: true })).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByRole("button", { name: "Pink wala", exact: true })).toHaveAttribute("aria-pressed", "false");
  await expect(page.locator(".garden-entry-reply")).toContainText("Tumhare liye rakh diya");
  expect(await page.evaluate((key) => sessionStorage.getItem(key), sessionKey)).toBeNull();
  await page.getByRole("button", { name: "Yeh wala, ab aage chalo", exact: true }).click();
  await expect(garden(page)).toHaveAttribute("data-stage", "2");
  await expect(page.locator(".garden-entry-copy h1")).toBeFocused();
  await expect(page.locator(".garden-love-note")).toContainText("Flowers achhe hain, but tumhari smile");
  await expect(page.locator(".story-experience")).toHaveCount(0);
  await page.getByRole("button", { name: "Ab surprise dikhao", exact: true }).click();
  await expect(garden(page)).toHaveCount(0);
  await expect(page.locator("#home h1")).toBeFocused();
  await expect(page.locator("#home h1")).toContainText("Rashika,");
  expect(await page.evaluate((key) => sessionStorage.getItem(key), sessionKey)).toBe("1");
  await page.reload();
  await expect(page.locator(".story-experience")).toBeVisible();
  await expect(garden(page)).toHaveCount(0);
  await page.getByRole("button", { name: "Garden mein phir chalein?" }).click();
  await expect(garden(page)).toHaveAttribute("data-stage", "0");
  await walk(page);
  await expect(page.locator(".garden-entry-next")).toBeDisabled();
  expect(errors).toEqual([]);
});

test("keyboard choices and backtracking work with reduced motion", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await walk(page);
  const flower = page.getByRole("button", { name: "Lilac wala", exact: true });
  await flower.focus(); await page.keyboard.press("Space");
  await expect(flower).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator(".garden-entry-reply")).toContainText("Mujhe bhi yeh wala pasand");
  await page.getByRole("button", { name: "Wapas chalein?" }).click();
  await expect(garden(page)).toHaveAttribute("data-stage", "0");
  await walk(page);
  await expect(flower).toHaveAttribute("aria-pressed", "true");
  await page.locator(".garden-entry-next").click();
  await expect(garden(page)).toHaveAttribute("data-stage", "2");
  await expect(page.locator(".entry-sculpture canvas")).toHaveCount(0);
  expect(await page.locator(".tulip-landscape").evaluate((element) => getComputedStyle(element).transitionDuration)).toBe("0s");
  await page.locator(".garden-entry-next").click();
  await expect(garden(page)).toHaveCount(0);
  expect(await page.locator("#home .ink-word").first().evaluate((element) => getComputedStyle(element).animationName)).toBe("none");
});

test("all garden chapters fit phones, landscape, tablets and desktop screens", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const [width, height] of [[320, 740], [390, 844], [568, 320], [768, 1024], [1440, 900], [1920, 1080]]) {
    await page.setViewportSize({ width, height });
    await page.goto("/");
    for (let stage = 0; stage < 3; stage++) {
      await expect(garden(page)).toHaveAttribute("data-stage", String(stage));
      const outside = await page.locator(".garden-entry-copy, .garden-entry-next, .garden-tulip-options button, .garden-love-note").evaluateAll((elements) => elements.filter((element) => {
        const bounds = element.getBoundingClientRect(); return bounds.left < -1 || bounds.right > innerWidth + 1;
      }).map((element) => element.className));
      expect(outside, `chapter ${stage} at ${width} x ${height}`).toEqual([]);
      expect(await garden(page).evaluate((element) => element.scrollWidth <= innerWidth)).toBe(true);
      await expect(page.locator(".entry-sculpture canvas")).toHaveCount(0);
      if (stage === 0) await walk(page);
      if (stage === 1) await pick(page);
    }
  }
});

test("missing graphics, storage and imagery cannot block the walk", async ({ page }) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    Object.defineProperty(HTMLCanvasElement.prototype, "getContext", { value(type: string, ...args: unknown[]) { return type.startsWith("webgl") ? null : Reflect.apply(original, this, [type, ...args]); } });
    Object.defineProperty(window, "sessionStorage", { get() { throw new Error("Storage unavailable"); } });
  });
  await page.route("**/images/{sky,sky-gemini,tulip-garden,tulip-garden-gemini}.webp", (route) => route.abort());
  await page.goto("/");
  await expect(page.locator(".entry-sculpture, .paper-tulip-garden")).toHaveCount(0);
  await walk(page); await pick(page);
  await page.getByRole("button", { name: "Ab surprise dikhao", exact: true }).click();
  await expect(garden(page)).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Chalo, dekho" })).toBeVisible();
});

test("Hinglish story headlines keep scroll animation and the letter feels personal", async ({ page }) => {
  await page.addInitScript((key) => sessionStorage.setItem(key, "1"), sessionKey);
  await page.goto("/");
  await expect(page.locator("#home h1")).toHaveClass(/ink-visible/);
  await expect(page.locator("#home h1")).toContainText("sirf tumhare liye");
  expect(await page.locator("#home .ink-word").first().evaluate((element) => getComputedStyle(element).animationName)).toBe("ink-arrive");
  await page.locator("#letter").scrollIntoViewIfNeeded();
  await expect(page.locator("#letter h2")).toContainText("Toh yahan likh diya");
  await page.locator(".envelope").click();
  await expect(page.getByRole("dialog")).toContainText("Smile karo, Rashika");
});
