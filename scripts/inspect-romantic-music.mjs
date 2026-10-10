import { chromium } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";

const destination = "output/romantic-music";
await mkdir(destination, { recursive: true });
const browser = await chromium.launch({ channel: "chrome", args: ["--enable-unsafe-swiftshader"] });
const report = { errors: [], captures: [] };
try {
  for (const [name, width, height] of [["desktop", 1440, 900], ["phone", 390, 844], ["small-phone", 320, 740]]) {
    const page = await browser.newPage({ viewport: { width, height }, reducedMotion: "reduce" });
    page.on("pageerror", error => report.errors.push(`${name}: ${error.message}`));
    await page.goto("http://127.0.0.1:3000", { waitUntil: "networkidle" });
    await page.screenshot({ path: `${destination}/${name}-entry.png` });
    const music = page.locator(".romantic-soundtrack");
    const initiallyPaused = await music.evaluate(audio => audio.paused && !audio.getAttribute("src"));
    await page.getByRole("button", { name: "Haan, chalo", exact: true }).click();
    await page.locator(".garden-music-toggle:has-text('Music rok do')").waitFor();
    await page.waitForTimeout(1400);
    await page.screenshot({ path: `${destination}/${name}-music-on.png` });
    const playing = await music.evaluate(audio => ({ duration: audio.duration, time: audio.currentTime, volume: audio.volume, loop: audio.loop, paused: audio.paused }));
    await page.getByRole("button", { name: "Pink wala", exact: true }).click();
    await page.getByRole("button", { name: "Yeh wala, ab aage chalo", exact: true }).click();
    await page.getByRole("button", { name: "Ab surprise dikhao", exact: true }).click();
    await page.locator(".entry-screen").waitFor({ state: "detached" });
    await page.screenshot({ path: `${destination}/${name}-story.png` });
    const story = await music.evaluate(audio => ({ paused: audio.paused, time: audio.currentTime }));
    if (name === "desktop") {
      report.recording = await page.evaluate(async () => {
        const bytes = await (await fetch("/audio/heartwarming.mp3")).arrayBuffer();
        const size = bytes.byteLength;
        const context = new OfflineAudioContext(2, 1, 44100);
        const decoded = await context.decodeAudioData(bytes);
        const samples = decoded.getChannelData(0);
        let peak = 0, square = 0, count = 0;
        for (let i = 0; i < samples.length; i += 32) {
          peak = Math.max(peak, Math.abs(samples[i])); square += samples[i] ** 2; count++;
        }
        return { duration: decoded.duration, sampleRate: decoded.sampleRate, channels: decoded.numberOfChannels, peak, rms: Math.sqrt(square / count), bytes: size };
      });
    }
    await page.locator(".sound-toggle").click();
    report.captures.push({ name, width, initiallyPaused, playing, story, stopped: await music.evaluate(audio => audio.paused), headerFits: await page.locator(".site-header").evaluate(header => header.scrollWidth <= innerWidth), scrollWidth: await page.evaluate(() => document.documentElement.scrollWidth) });
    await page.close();
  }
} finally { await browser.close(); }
await writeFile(`${destination}/browser.json`, JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
