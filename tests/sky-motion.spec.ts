import { test, expect } from "./fixtures";

test("supplied sky footage visibly changes frames and loops silently behind the story", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto("/");
  const video = page.locator("#home .sky-motion");
  await expect(video).toHaveClass(/motion-ready/);
  await expect(video).toHaveAttribute("src", "/video/sky-gemini.mp4");
  const start = await video.evaluate(element => {
    const movie = element as HTMLVideoElement;
    return { time: movie.currentTime, duration: movie.duration, paused: movie.paused, muted: movie.muted, loop: movie.loop, inline: movie.playsInline };
  });
  expect(start.paused).toBe(false);
  expect(start.muted && start.loop && start.inline).toBe(true);
  expect(start.duration).toBeGreaterThan(9);
  expect(start.duration).toBeLessThan(11);
  await expect.poll(() => video.evaluate(element => (element as HTMLVideoElement).currentTime)).toBeGreaterThan(start.time);
  const difference = await video.evaluate(async element => {
    const movie = element as HTMLVideoElement;
    movie.pause();
    const frame = async (time: number) => {
      await new Promise<void>(resolve => {
        movie.addEventListener("seeked", () => resolve(), { once: true });
        movie.currentTime = time;
      });
      const canvas = document.createElement("canvas");
      canvas.width = 64; canvas.height = 36;
      const context = canvas.getContext("2d")!;
      context.drawImage(movie, 0, 0, canvas.width, canvas.height);
      return context.getImageData(0, 0, canvas.width, canvas.height).data;
    };
    const first = await frame(1), second = await frame(4);
    return first.reduce((sum, value, i) => sum + Math.abs(value - second[i]), 0) / first.length;
  });
  expect(difference).toBeGreaterThan(.1);
  await video.evaluate(element => {
    const movie = element as HTMLVideoElement;
    movie.currentTime = movie.duration - .2;
    void movie.play();
  });
  await expect.poll(() => video.evaluate(element => (element as HTMLVideoElement).currentTime)).toBeLessThan(1.5);
  await expect(page.getByRole("link", { name: "Chalo, dekho" })).toBeVisible();
  expect(await page.evaluate(() => document.body.scrollWidth <= innerWidth)).toBe(true);
  expect(errors).toEqual([]);
});

test("offscreen sky pauses, the ending plays, and replay removes both story players", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  const hero = page.locator("#home .sky-motion");
  const ending = page.locator("#ending .sky-motion");
  await expect(hero).toHaveClass(/motion-ready/);
  await expect(ending).not.toHaveAttribute("src");
  await page.locator("#ending").scrollIntoViewIfNeeded();
  await expect(ending).toHaveClass(/motion-ready/);
  await expect.poll(() => hero.evaluate(element => (element as HTMLVideoElement).paused)).toBe(true);
  await expect.poll(() => ending.evaluate(element => (element as HTMLVideoElement).paused)).toBe(false);
  await page.locator("#home").scrollIntoViewIfNeeded();
  await expect.poll(() => hero.evaluate(element => (element as HTMLVideoElement).paused)).toBe(false);
  await expect.poll(() => ending.evaluate(element => (element as HTMLVideoElement).paused)).toBe(true);
  await page.getByRole("button", { name: "Garden mein phir chalein?" }).click();
  await expect(page.locator(".sky-motion")).toHaveCount(0);
  await expect(page.locator(".entry-screen")).toHaveAttribute("data-stage", "0");
});

test("reduced motion keeps a matching poster without fetching the sky video", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  const requests: string[] = [];
  page.on("request", request => { if (request.url().includes("/video/sky-gemini.mp4")) requests.push(request.url()); });
  await page.goto("/");
  const video = page.locator("#home .sky-motion");
  await expect(video).not.toHaveAttribute("src");
  expect(requests).toEqual([]);
  expect(await page.locator("#home .sky-backdrop").evaluate(element => getComputedStyle(element).backgroundImage)).toContain("sky-gemini.webp");
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await expect(video).toHaveClass(/motion-ready/);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(video).not.toHaveAttribute("src");
  expect(await video.evaluate(element => (element as HTMLVideoElement).paused)).toBe(true);
});

test("missing sky footage leaves the poster and story controls usable", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.route("**/video/sky-gemini.mp4", route => route.fulfill({ status: 404, body: "Unavailable" }));
  await page.goto("/");
  await expect.poll(() => page.locator("#home .sky-motion").evaluate(element => !!(element as HTMLVideoElement).error)).toBe(true);
  await expect(page.locator("#home .sky-motion")).not.toHaveClass(/motion-ready/);
  expect(await page.locator("#home .sky-backdrop").evaluate(element => getComputedStyle(element).backgroundImage)).toContain("sky-gemini.webp");
  await page.getByRole("link", { name: "Chalo, dekho" }).click();
  await expect(page).toHaveURL(/#story/);
  await page.locator(".envelope").click();
  await expect(page.getByRole("dialog")).toContainText("Rashika, suno na");
});
