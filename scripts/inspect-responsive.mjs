import { chromium } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";

const destination = "output/responsive-motion";
await mkdir(destination, { recursive: true });
const browser = await chromium.launch({ channel: "chrome", args: ["--enable-unsafe-swiftshader"] });
const results = [];
const errors = [];
try {
  for (const [name, width, height] of [["phone", 390, 844], ["tablet", 768, 1024], ["desktop", 1440, 900]]) {
    const page = await browser.newPage({ viewport: { width, height } });
    await page.addInitScript(() => sessionStorage.setItem("for-you:tulip-walk:v3", "1"));
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(process.env.PREVIEW_URL || "http://127.0.0.1:3001", { waitUntil: "networkidle" });
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: `${destination}/${name}-hero.png` });
    for (const selector of [".little-universe", "#little-things", "#gallery", "#games"]) {
      const section = page.locator(selector);
      await section.scrollIntoViewIfNeeded();
      await page.waitForTimeout(1200);
      if (selector === ".little-universe") {
        await page.evaluate(() => {
          const scene = document.querySelector(".little-universe");
          window.scrollTo({ top: scene.getBoundingClientRect().top + scrollY + 100, behavior: "instant" });
        });
        await page.waitForTimeout(700);
        await page.screenshot({ path: `${destination}/${name}-universe.png` });
      } else await section.screenshot({ path: `${destination}/${name}-${selector.slice(1)}.png` });
    }
    await page.goto(new URL("/world", page.url()).href, { waitUntil: "networkidle" });
    await page.screenshot({ path: `${destination}/${name}-world.png` });
    results.push({ name, width, bodyWidth: await page.evaluate(() => document.documentElement.scrollWidth) });
    await page.close();
  }
} finally { await browser.close(); }
await writeFile(`${destination}/browser.json`, JSON.stringify({ results, errors }, null, 2));
console.log(JSON.stringify({ results, errors }, null, 2));
