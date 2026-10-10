import { mkdir, writeFile, readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import sharp from "sharp";
await mkdir("public/fonts", { recursive: true });
await mkdir("public/images", { recursive: true });
const photos = [
  "photo-1516589178581-6cd7833ae3b2",
  "photo-1473116763249-2faaef81ccda",
  "photo-1490750967868-88aa4486c946",
  "photo-1518837695005-2083093ee35b",
  "photo-1470252649378-9c29740c9fa8",
  "photo-1500534623283-312aade485b7",
];
await Promise.all(
  photos.map(async (id, index) => {
    if (existsSync(`public/images/memory-${index + 1}.jpg`)) return;
    const url = `https://images.unsplash.com/${id}?auto=format&fit=crop&w=900&q=85`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Photo ${index + 1}: ${response.status}`);
    await sharp(Buffer.from(await response.arrayBuffer()))
      .resize(900, 1000, { fit: "inside" })
      .jpeg({ quality: 85 })
      .toFile(`public/images/memory-${index + 1}.jpg`);
    console.log(`Saved sample photo ${index + 1}`);
  }),
);
// Smaller runtime copies keep the six sample photographs cheap on phones.
await Promise.all(
  photos.map(async (_, index) => {
    await sharp(`public/images/memory-${index + 1}.jpg`)
      .webp({ quality: 78 })
      .toFile(`public/images/memory-${index + 1}.webp`);
  }),
);
if (!existsSync("public/images/sky.webp"))
  await sharp(await readFile("public/images/sky-original.png"))
    .resize(1920)
    .webp({ quality: 85 })
    .toFile("public/images/sky.webp");
for (const [name, family] of [
  ["serif", "Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500"],
  ["sans", "DM+Sans:wght@400;500;600"],
  ["hand", "Caveat:wght@400;500"],
]) {
  const cssResponse = await fetch(
    `https://fonts.googleapis.com/css2?family=${family}&display=swap`,
    {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36",
      },
    },
  );
  const css = await cssResponse.text();
  const entries = [...css.matchAll(/@font-face\s*\{([^}]+)\}/g)];
  let index = 0;
  let localCss = "";
  for (const entry of entries) {
    const block = entry[1];
    if (block.includes("unicode-range") && !block.includes("U+0000-00FF"))
      continue;
    const url = block.match(/url\(([^)]+)\)/)?.[1];
    if (!url) continue;
    const filename = `${name}-${index++}.woff2`;
    const font = await fetch(url);
    if (!font.ok) throw new Error(`Font ${name} failed`);
    await writeFile(
      `public/fonts/${filename}`,
      Buffer.from(await font.arrayBuffer()),
    );
    localCss += `@font-face {${block.replace(url, `/fonts/${filename}`)}}\n`;
  }
  await writeFile(`public/fonts/${name}.css`, localCss);
  console.log(`Saved ${name} fonts`);
}
