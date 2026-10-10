import { test, expect } from "./fixtures";

test("story content and navigation fit narrow phones, tablets and wide screens", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const width of [320, 390, 640, 768, 1024, 1440, 1920]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    await expect(page.locator(".story-experience")).toBeVisible();
    await page.evaluate(() => document.fonts.ready);
    const layout = await page.evaluate(() => {
      const hero = document.querySelector(".hero-copy")!.getBoundingClientRect();
      const art = document.querySelector(".hero-art")!.getBoundingClientRect();
      const content = [...document.querySelectorAll(".hero-copy, .hero-actions .button, .intro-note, .notes-collection, .gallery-grid, .game-preview-grid, .universe-stage")];
      return {
        overflow: document.documentElement.scrollWidth > innerWidth,
        outside: content.filter((element) => {
          const box = element.getBoundingClientRect();
          return box.left < -1 || box.right > innerWidth + 1;
        }).map((element) => element.className),
        overlap: innerWidth <= 640 && art.top < hero.bottom,
      };
    });
    expect(layout, `layout at ${width}px`).toEqual({ overflow: false, outside: [], overlap: false });
    if (width <= 1100) {
      await page.getByRole("button", { name: "Open menu" }).click();
      await expect(page.getByRole("navigation", { name: "Main navigation" })).toBeVisible();
      await page.getByRole("navigation").getByRole("link", { name: "Yaadein", exact: true }).click();
      await expect(page.getByRole("button", { name: "Open menu" })).toHaveAttribute("aria-expanded", "false");
    }
  }
  expect(errors).toEqual([]);
});

test("little universe responds to scroll and its photographs remain keyboard accessible", async ({ page }) => {
  await page.goto("/");
  const universe = page.locator(".little-universe");
  await universe.scrollIntoViewIfNeeded();
  const art = page.locator(".universe-island");
  const initial = await art.evaluate((element) => getComputedStyle(element).transform);
  await page.evaluate(() => window.scrollBy(0, 200));
  await expect.poll(() => art.evaluate((element) => getComputedStyle(element).transform)).not.toBe(initial);
  const photo = universe.locator(".polaroid").first();
  await photo.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(photo).toBeFocused();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect.poll(() => art.evaluate((element) => getComputedStyle(element).transform)).toBe("none");
});

test("little world navigation and objects fit compact screens", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const width of [320, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/world");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    const outside = await page.locator(".world-header nav a, .world-object").evaluateAll((elements) => elements.filter((element) => {
      const box = element.getBoundingClientRect();
      return box.left < -1 || box.right > innerWidth + 1;
    }).map((element) => element.textContent));
    expect(outside).toEqual([]);
  }
});
