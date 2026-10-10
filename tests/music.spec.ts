import { test, expect } from "@playwright/test";

test("romantic piano starts with the walk and continues through the reveal as one player", async ({ page }) => {
  const requests: string[] = [];
  const errors: string[] = [];
  page.on("request", request => { if (request.url().includes("/audio/heartwarming.mp3")) requests.push(request.url()); });
  page.on("pageerror", error => errors.push(error.message));
  await page.goto("/");
  const audio = page.locator(".romantic-soundtrack");
  await expect(audio).not.toHaveAttribute("src");
  expect(requests).toEqual([]);
  await expect(page.locator(".garden-music-toggle")).toHaveAttribute("aria-pressed", "false");
  await page.getByRole("button", { name: "Haan, chalo", exact: true }).click();
  await expect(page.locator(".garden-music-toggle")).toHaveText("Music rok do");
  await expect.poll(() => audio.evaluate(element => (element as HTMLAudioElement).volume)).toBeGreaterThan(.2);
  const first = await audio.evaluate(element => {
    const music = element as HTMLAudioElement;
    return { time: music.currentTime, duration: music.duration, paused: music.paused, loop: music.loop, src: music.getAttribute("src") };
  });
  expect(first.paused).toBe(false); expect(first.loop).toBe(true);
  expect(first.src).toBe("/audio/heartwarming.mp3");
  expect(first.duration).toBeGreaterThan(65); expect(first.duration).toBeLessThan(85);
  await expect(page.locator(".entry-screen")).toHaveAttribute("data-stage", "1");
  await page.getByRole("button", { name: "Pink wala", exact: true }).click();
  await page.getByRole("button", { name: "Yeh wala, ab aage chalo", exact: true }).click();
  await expect(page.locator(".entry-screen")).toHaveAttribute("data-stage", "2");
  await page.getByRole("button", { name: "Ab surprise dikhao", exact: true }).click();
  await expect(page.locator(".entry-screen")).toHaveCount(0);
  await expect(audio).toHaveCount(1);
  await expect(page.locator(".sound-toggle")).toHaveAttribute("aria-pressed", "true");
  expect(await audio.evaluate(element => (element as HTMLAudioElement).currentTime)).toBeGreaterThan(first.time + 1);
  await page.locator(".sound-toggle").click();
  expect(await audio.evaluate(element => (element as HTMLAudioElement).paused)).toBe(true);
  await page.getByRole("button", { name: "Garden mein phir chalein?" }).click();
  await page.getByRole("button", { name: "Haan, chalo", exact: true }).click();
  await expect(page.locator(".garden-music-toggle")).toHaveAttribute("aria-pressed", "false");
  expect(errors).toEqual([]);
});

test("music can be controlled by keyboard and a pause choice is respected", async ({ page }) => {
  await page.goto("/");
  const toggle = page.locator(".garden-music-toggle");
  for (const width of [320, 390, 1440]) {
    await page.setViewportSize({ width, height: 844 });
    expect(await page.locator(".garden-entry-header").evaluate(header => [...header.children].every(child => {
      const bounds = child.getBoundingClientRect(); return bounds.left >= 0 && bounds.right <= innerWidth;
    }))).toBe(true);
  }
  await toggle.focus(); await page.keyboard.press("Enter");
  await expect(toggle).toHaveText("Music rok do");
  await page.keyboard.press("Space");
  await expect(toggle).toHaveAttribute("aria-pressed", "false");
  await page.getByRole("button", { name: "Haan, chalo", exact: true }).click();
  await expect(page.locator(".entry-screen")).toHaveAttribute("data-stage", "1");
  expect(await page.locator(".romantic-soundtrack").evaluate(element => (element as HTMLAudioElement).paused)).toBe(true);
});

test("music pauses for other media and hidden tabs and can resume explicitly", async ({ page }) => {
  await page.goto("/");
  const toggle = page.locator(".garden-music-toggle");
  await toggle.click(); await expect(toggle).toHaveText("Music rok do");
  await page.evaluate(() => window.dispatchEvent(new CustomEvent("for-you:audio", { detail: "memory-video" })));
  await expect(toggle).toHaveAttribute("aria-pressed", "false");
  await toggle.click(); await expect(toggle).toHaveText("Music rok do");
  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", { configurable: true, value: true });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await expect(toggle).toHaveAttribute("aria-pressed", "false");
  expect(await page.locator(".romantic-soundtrack").evaluate(element => (element as HTMLAudioElement).paused)).toBe(true);
  await page.evaluate(() => { Object.defineProperty(document, "hidden", { configurable: true, value: false }); document.dispatchEvent(new Event("visibilitychange")); });
  await expect(toggle).toHaveAttribute("aria-pressed", "false");
  await toggle.click(); await expect(toggle).toHaveText("Music rok do");
});

test("missing music cannot block the garden; retry loads the actual track", async ({ page }) => {
  await page.route("**/audio/heartwarming.mp3", route => route.fulfill({ status: 404, body: "Unavailable" }));
  await page.goto("/");
  await page.getByRole("button", { name: "Haan, chalo", exact: true }).click();
  await expect(page.locator(".entry-screen")).toHaveAttribute("data-stage", "1");
  await expect(page.locator(".garden-music-toggle")).toHaveAttribute("aria-pressed", "false");
  await page.getByRole("button", { name: "Cream wala", exact: true }).click();
  await expect(page.getByRole("button", { name: "Yeh wala, ab aage chalo", exact: true })).toBeEnabled();
  await page.unroute("**/audio/heartwarming.mp3");
  await page.locator(".garden-music-toggle").click();
  await expect(page.locator(".garden-music-toggle")).toHaveText("Music rok do");
});
