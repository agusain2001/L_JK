import { chromium } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
const destination = "output/tulip-garden";
await mkdir(destination, { recursive: true });
const browser = await chromium.launch({ channel: "chrome", args: ["--enable-unsafe-swiftshader"] });
const errors = [], layouts = [];
try {
  for (const [name, width, height, reducedMotion] of [["desktop", 1440, 900, "no-preference"], ["phone", 390, 844, "no-preference"], ["small-phone-static", 320, 740, "reduce"]]) {
    const page = await browser.newPage({ viewport: { width, height }, reducedMotion });
    page.on("pageerror", (error) => errors.push(`${name}: ${error.message}`));
    page.on("console", (message) => { if (message.type() === "error") errors.push(`${name}: ${message.text()}`); });
    await page.goto(process.env.PREVIEW_URL || "http://127.0.0.1:3000", { waitUntil: "networkidle" });
    await page.evaluate(() => document.fonts.ready);
    if (reducedMotion !== "reduce") await page.locator(".garden-motion.motion-ready").waitFor();
    await page.waitForTimeout(1500);
    for (let stage = 0; stage < 3; stage++) {
      await page.locator(`.entry-screen[data-stage="${stage}"]`).waitFor();
      await page.waitForTimeout(reducedMotion === "reduce" ? 100 : 1300);
      await page.screenshot({ path: `${destination}/${name}-walk-${stage}.png` });
      layouts.push(await page.locator(".entry-screen").evaluate((screen) => ({ stage: screen.dataset.stage, width: innerWidth, height: innerHeight, contentWidth: screen.scrollWidth, contentHeight: screen.scrollHeight, actionBottom: screen.querySelector(".garden-entry-next").getBoundingClientRect().bottom, webgl: !!screen.querySelector("canvas") })));
      if (stage === 1) {
        await page.getByRole("button", { name: "Pink wala", exact: true }).click();
        await page.waitForTimeout(reducedMotion === "reduce" ? 100 : 1300);
        await page.screenshot({ path: `${destination}/${name}-tulip-choice.png` });
      }
      await page.locator(".garden-entry-next").click();
      if (stage === 2 && reducedMotion !== "reduce") {
        await page.waitForTimeout(650);
        await page.screenshot({ path: `${destination}/${name}-reveal.png` });
      }
    }
    await page.locator(".entry-screen").waitFor({ state: "detached" });
    await page.waitForTimeout(1200);
    await page.screenshot({ path: `${destination}/${name}-story.png` });
    if (width > 1000) for (const selector of ["#little-things", "#garden", "#letter"]) {
      await page.locator(selector).scrollIntoViewIfNeeded();
      await page.waitForTimeout(1100);
      await page.screenshot({ path: `${destination}/desktop-${selector.slice(1)}.png` });
    }
    await page.close();
  }
} finally { await browser.close(); }
await writeFile(`${destination}/browser.json`, JSON.stringify({ layouts, errors }, null, 2));
console.log(JSON.stringify({ layouts, errors }, null, 2));
