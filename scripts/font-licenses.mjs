import { mkdir, writeFile } from "node:fs/promises";
await mkdir("public/fonts/licenses", { recursive: true });
for (const family of ["cormorantgaramond", "dmsans", "caveat"]) {
  const response = await fetch(
    `https://raw.githubusercontent.com/google/fonts/main/ofl/${family}/OFL.txt`,
  );
  if (!response.ok) throw new Error(`License download failed for ${family}`);
  await writeFile(
    `public/fonts/licenses/${family}-OFL.txt`,
    await response.text(),
  );
  console.log(`Saved ${family} license`);
}
