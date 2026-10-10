import { test, expect, type Locator } from "@playwright/test";
import sharp from "sharp";

async function encodedFrame(video: Locator, time: number) {
  const base64 = await video.evaluate(async (element, seconds) => {
    const movie = element as HTMLVideoElement;
    movie.pause();
    await new Promise<void>((resolve) => { movie.addEventListener("seeked", () => resolve(), { once: true }); movie.currentTime = seconds; });
    const canvas = document.createElement("canvas"); canvas.width = movie.videoWidth; canvas.height = movie.videoHeight;
    canvas.getContext("2d")!.drawImage(movie, 0, 0);
    return canvas.toDataURL("image/png").split(",")[1];
  }, time);
  return Buffer.from(base64, "base64");
}
async function difference(a: Buffer, b: Buffer, region: { left: number; top: number; width: number; height: number }) {
  const first = await sharp(a).extract(region).removeAlpha().raw().toBuffer();
  const second = await sharp(b).extract(region).removeAlpha().raw().toBuffer();
  return first.reduce((sum, value, index) => sum + Math.abs(value - second[index]), 0) / first.length;
}

test("the supplied Gemini clip plays directly as a muted inline looping background", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  const video = page.locator(".garden-motion");
  await expect(video).toHaveClass(/motion-ready/);
  await expect(video).toHaveAttribute("src", "/video/tulip-garden-gemini.mp4");
  await expect(page.locator(".garden-breeze")).toHaveCount(0);
  const start = await video.evaluate((element) => { const v = element as HTMLVideoElement; return { time: v.currentTime, duration: v.duration, paused: v.paused, muted: v.muted, loop: v.loop, inline: v.playsInline, width: v.videoWidth, height: v.videoHeight }; });
  expect(start.paused).toBe(false); expect(start.muted).toBe(true); expect(start.loop).toBe(true); expect(start.inline).toBe(true);
  expect(start.duration).toBeGreaterThan(9); expect(start.duration).toBeLessThan(11);
  await page.waitForTimeout(600);
  expect(await video.evaluate((element) => (element as HTMLVideoElement).currentTime)).toBeGreaterThan(start.time);
  const first = await encodedFrame(video, 1);
  const second = await encodedFrame(video, 4);
  const region = (x: number, y: number, w: number, h: number) => ({ left: Math.floor(x * start.width), top: Math.floor(y * start.height), width: Math.floor(w * start.width), height: Math.floor(h * start.height) });
  const flowers = await difference(first, second, region(.78, .68, .15, .23));
  expect(flowers).toBeGreaterThan(8);
  await video.evaluate((element) => { const v = element as HTMLVideoElement; v.currentTime = v.duration - .2; void v.play(); });
  await page.waitForTimeout(600);
  expect(await video.evaluate((element) => (element as HTMLVideoElement).currentTime)).toBeLessThan(1);
  expect(errors).toEqual([]);
});

test("video motion works without WebGL and reduced motion does not fetch or play a clip", async ({ page }) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    Object.defineProperty(HTMLCanvasElement.prototype, "getContext", { value(type: string, ...args: unknown[]) { return type.startsWith("webgl") ? null : Reflect.apply(original, this, [type, ...args]); } });
  });
  await page.emulateMedia({ reducedMotion: "reduce" });
  const clips: string[] = [];
  page.on("request", (request) => { if (request.url().includes("/video/tulip-garden")) clips.push(request.url()); });
  await page.goto("/");
  const video = page.locator(".garden-motion");
  await expect(video).not.toHaveAttribute("src");
  expect(clips).toEqual([]);
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await expect(video).toHaveClass(/motion-ready/);
  await expect(page.locator(".entry-sculpture canvas")).toHaveCount(0);
  await expect(page.locator(".entry-sculpture, .paper-tulip-garden")).toHaveCount(0);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(video).not.toHaveAttribute("src");
  expect(await video.evaluate((element) => (element as HTMLVideoElement).paused)).toBe(true);
  await expect(page.getByRole("button", { name: "Haan, chalo", exact: true })).toBeEnabled();
});

test("pointer movement leaves the clip unfiltered; missing video does not block entry", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  await expect(page.locator(".garden-motion")).toHaveClass(/motion-ready/);
  const bounds = await page.locator(".entry-screen").boundingBox();
  await page.mouse.move(bounds!.width * .92, bounds!.height * .79);
  await expect(page.locator(".garden-breeze")).toHaveCount(0);
  expect(await page.locator(".garden-motion").evaluate(element => getComputedStyle(element).filter)).toBe("none");
  await page.route("**/video/tulip-garden*.mp4", (route) => route.fulfill({ status: 404, body: "Unavailable" }));
  await page.reload();
  await expect(page.locator(".garden-motion")).not.toHaveClass(/motion-ready/);
  expect(await page.locator(".tulip-landscape").evaluate(element => getComputedStyle(element).backgroundImage)).toContain("tulip-garden-gemini.webp");
  await expect(page.getByRole("button", { name: "Haan, chalo", exact: true })).toBeEnabled();
  await page.getByRole("button", { name: "Haan, chalo", exact: true }).click();
  await expect(page.locator(".entry-screen")).toHaveAttribute("data-stage", "1");
  await page.getByRole("button", { name: "Pink wala", exact: true }).click();
  await expect(page.getByRole("button", { name: "Yeh wala, ab aage chalo", exact: true })).toBeEnabled();
});
