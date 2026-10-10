import { chromium } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
import sharp from "sharp";

const destination = "output/gemini-garden";
await mkdir(destination, { recursive: true });
const browser = await chromium.launch({ channel: "chrome", args: ["--enable-unsafe-swiftshader"] });
const report = { errors: [], captures: [] };
async function compare(first, second, region) {
  const a = await sharp(first).extract(region).removeAlpha().raw().toBuffer();
  const b = await sharp(second).extract(region).removeAlpha().raw().toBuffer();
  let total = 0;
  for (let i = 0; i < a.length; i++) total += Math.abs(a[i] - b[i]);
  return +(total / a.length).toFixed(3);
}
try {
  for (const [name, width, height] of [["desktop", 1440, 900], ["phone", 390, 844]]) {
    const page = await browser.newPage({ viewport: { width, height }, reducedMotion: "no-preference" });
    page.on("pageerror", (e) => report.errors.push(`${name}: ${e.message}`));
    page.on("console", (e) => { if (e.type() === "error") report.errors.push(`${name}: ${e.text()}`); });
    await page.goto("http://127.0.0.1:3000", { waitUntil: "networkidle" });
    const video = page.locator(".garden-motion.motion-ready");
    await video.waitFor();
    await page.waitForTimeout(1100);
    await page.screenshot({ path: `${destination}/${name}-entry.png` });
    const metadata = await video.evaluate((v) => ({ source: v.getAttribute("src"), width: v.videoWidth, height: v.videoHeight, duration: v.duration, playing: !v.paused, muted: v.muted, loop: v.loop }));
    const frames = [];
    const views = [];
    await page.addStyleTag({ content: ".garden-entry-header,.garden-entry-body,.garden-entry-footer,.garden-pollen { visibility:hidden !important; }" });
    for (const seconds of [1, 4]) {
      const encoded = await video.evaluate(async (v, time) => {
        v.pause(); await new Promise(resolve => { v.addEventListener("seeked", resolve, { once: true }); v.currentTime = time; });
        const canvas = document.createElement("canvas"); canvas.width = v.videoWidth; canvas.height = v.videoHeight;
        canvas.getContext("2d").drawImage(v, 0, 0);
        return canvas.toDataURL("image/png").split(",")[1];
      }, seconds);
      const bytes = Buffer.from(encoded, "base64"); frames.push(bytes);
      await writeFile(`${destination}/${name}-frame-${seconds}.png`, bytes);
      views.push(await page.screenshot({ path: `${destination}/${name}-background-${seconds}.png` }));
    }
    const region = (x, y, w, h) => ({ left: Math.floor(x * metadata.width), top: Math.floor(y * metadata.height), width: Math.floor(w * metadata.width), height: Math.floor(h * metadata.height) });
    const visibleFlowers = name === "phone" ? { left: 0, top: 490, width: 100, height: 190 } : { left: 1240, top: 640, width: 180, height: 160 };
    report.captures.push({ name, ...metadata, flowers: await compare(...frames, region(.78, .68, .15, .23)), visibleFlowers: await compare(...views, visibleFlowers), sky: await compare(...frames, region(.15, .10, .15, .10)), path: await compare(...frames, region(.53, .90, .05, .05)), scrollWidth: await page.locator(".entry-screen").evaluate(e => e.scrollWidth) });
    await page.close();
  }
} finally { await browser.close(); }
await writeFile(`${destination}/browser.json`, JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
