import { chromium } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
await mkdir("output", { recursive: true });
const browser = await chromium.launch({
  channel: "chrome",
  headless: true,
  args: ["--enable-unsafe-swiftshader"],
});
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.addInitScript(() => sessionStorage.setItem("for-you:tulip-walk:v3", "1"));
const errors = [];
const url = process.env.PREVIEW_URL || "http://127.0.0.1:3257";
page.on("pageerror", (e) => errors.push(e.message));
page.on("console", (msg) => {
  if (msg.type() === "error") errors.push(msg.text());
});
const response = await page.goto(url, { waitUntil: "domcontentloaded" });
if (!response.ok()) throw new Error(`Preview returned ${response.status()}`);
await page.locator(".story-experience").waitFor();
await page.locator("#home .three-photo-hit").first().waitFor();
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(1500);
await page.screenshot({ path: "output/desktop.png" });
await page.screenshot({ path: "output/full-page.png", fullPage: true });
const desktop = await page.evaluate(() => ({
  width: innerWidth,
  bodyWidth: document.body.scrollWidth,
  canvas: !!document.querySelector("canvas"),
  photos: document.querySelectorAll(".three-photo-hit").length,
  fonts: document.fonts.check(
    "16px " + getComputedStyle(document.querySelector("h1")).fontFamily,
  ),
  h1: document.querySelector("h1")?.getBoundingClientRect().toJSON(),
}));
for (const id of ["memories", "little-things", "garden", "letter"]) {
  await page.locator(`#${id}`).scrollIntoViewIfNeeded();
  await page.waitForTimeout(1100);
  await page.locator(`#${id}`).screenshot({ path: `output/${id}.png` });
}
await page.setViewportSize({ width: 390, height: 844 });
await page.goto(url, { waitUntil: "domcontentloaded" });
await page.locator(".story-experience").waitFor();
await page.locator("#home .scene-fallback .polaroid").first().waitFor();
await page.waitForTimeout(1200);
await page.screenshot({ path: "output/mobile.png" });
const mobile = await page.evaluate(() => ({
  width: innerWidth,
  bodyWidth: document.body.scrollWidth,
  canvas: !!document.querySelector("#home canvas"),
  photos: document.querySelectorAll("#home .scene-fallback .polaroid").length,
  cta: document
    .querySelector(".hero-actions")
    ?.getBoundingClientRect()
    .toJSON(),
}));
for (const id of ["memories", "little-things", "letter", "gallery"]) {
  await page.locator(`#${id}`).scrollIntoViewIfNeeded();
  await page.waitForTimeout(700);
  await page.locator(`#${id}`).screenshot({ path: `output/mobile-${id}.png` });
}
await writeFile(
  "output/browser-inspection.json",
  JSON.stringify({ desktop, mobile, errors }, null, 2),
);
console.log(JSON.stringify({ desktop, mobile, errors }, null, 2));
await browser.close();
