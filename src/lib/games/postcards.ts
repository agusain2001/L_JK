import type { Bouquet } from "./schemas";
export const xml = (value: string) =>
  value.replace(
    /[<>&"']/g,
    (c) =>
      ({
        "<": "&lt;",
        ">": "&gt;",
        "&": "&amp;",
        '"': "&quot;",
        "'": "&apos;",
      })[c]!,
  );
export function flowerArt(type: string, color: string) {
  const petals = Array.from(
    { length: type === "wildflower" ? 5 : 8 },
    (_, i) =>
      `<ellipse cx="50" cy="28" rx="${type === "wildflower" ? 10 : 9}" ry="18" fill="${color}" transform="rotate(${i * (type === "wildflower" ? 72 : 45)} 50 50)"/>`,
  ).join("");
  let head = petals + `<circle cx="50" cy="50" r="9" fill="#d4b864"/>`;
  if (type === "tulip")
    head = `<path d="M26 35 Q31 29 39 40 L50 26 L61 40 Q70 29 74 35 Q77 71 50 74 Q23 71 26 35" fill="${color}"/><path d="M50 33V69M36 42Q40 65 50 70M65 42Q61 65 50 70" fill="none" stroke="#ad776e" stroke-width="1.5" opacity=".45"/>`;
  if (type === "rose")
    head = Array.from(
      { length: 5 },
      (_, i) =>
        `<ellipse cx="50" cy="${48 - i * 2}" rx="${25 - i * 4}" ry="${22 - i * 3}" fill="${color}" stroke="#a36c77" stroke-width="1.4" transform="rotate(${i * 36} 50 50)"/>`,
    ).join("");
  return `<path d="M50 62 Q44 102 50 155" fill="none" stroke="#7c9978" stroke-width="3"/><path d="M48 111Q22 94 29 81Q50 87 48 111M48 128Q70 108 78 113Q75 132 48 128" fill="#a2b395"/>${head}`;
}
export function flowerPositions(bouquet: Bouquet) {
  return bouquet.flowers.map((flower, i) => {
    const middle = (bouquet.flowers.length - 1) / 2;
    return {
      ...flower,
      x: 450 + (i - middle) * (bouquet.arrangement === "gathered" ? 48 : 72),
      y:
        bouquet.arrangement === "cascade"
          ? 270 + i * 27
          : 290 + Math.abs(i - middle) * 18,
      rotation: (i - middle) * (bouquet.arrangement === "gathered" ? 9 : 16),
    };
  });
}
export function bouquetArtwork(bouquet: Bouquet, finished = true) {
  const wrap = { cream: "#f3e1c7", peach: "#e9c0af", sage: "#bdc9ad" }[
    bouquet.wrap
  ];
  const ribbon = { rose: "#bd7c86", sage: "#829b79", blue: "#8ba9c0" }[
    bouquet.ribbon
  ];
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 1050" width="900" height="1050"><rect width="900" height="1050" fill="#fbf2e6"/><text x="450" y="105" text-anchor="middle" fill="#765a55" font-family="Georgia,serif" font-size="35">a bouquet just for you</text><ellipse cx="450" cy="715" rx="200" ry="24" fill="#b79c8a" opacity=".12"/>${flowerPositions(
    bouquet,
  )
    .map(
      (f) =>
        `<g transform="translate(${f.x} ${f.y}) rotate(${f.rotation}) scale(2.1) translate(-50 -50)">${flowerArt(f.type, f.color)}</g>`,
    )
    .join(
      "",
    )}${finished ? `<path d="M267 430L633 430L493 733L403 733Z" fill="${wrap}"/><path d="M267 430L493 733L403 733Z" fill="#fff7e8" opacity=".32"/><path d="M285 435L453 629L616 435" fill="none" stroke="#fffaf0" stroke-width="3" opacity=".5"/><path d="M401 629Q330 594 356 575Q390 559 449 626Q506 559 541 575Q570 596 498 629" fill="none" stroke="${ribbon}" stroke-width="17"/><path d="M440 630L405 710M461 630L496 710" stroke="${ribbon}" stroke-width="13"/><ellipse cx="450" cy="630" rx="15" ry="12" fill="${ribbon}"/>` : ""}</svg>`;
}
function lines(value: string, max = 42, limit = 6) {
  const result: string[] = [];
  let line = "";
  for (const word of value.split(/\s+/)) {
    if ((line + word).length > max) {
      if (line.trim()) result.push(line.trim());
      line = "";
    }
    if (word.length > max) {
      if (line) result.push(line.trim());
      for (let i = 0; i < word.length; i += max)
        result.push(word.slice(i, i + max));
      line = "";
    } else line += word + " ";
  }
  if (line.trim()) result.push(line.trim());
  return result.slice(0, limit);
}
export function bouquetPostcard(bouquet: Bouquet) {
  return bouquetArtwork(bouquet).replace(
    "</svg>",
    `${lines(bouquet.note || "A little bouquet, picked with love.")
      .map(
        (line, i) =>
          `<text x="450" y="${825 + i * 32}" text-anchor="middle" fill="#765a55" font-family="Georgia,serif" font-size="24">${xml(line)}</text>`,
      )
      .join(
        "",
      )}<text x="450" y="1010" text-anchor="middle" fill="#a36d75" font-family="Georgia,serif" font-size="20">for you ♡</text></svg>`,
  );
}
export function adventurePostcard(title: string, choices: string[]) {
  const titleLines = lines(title, 48, Infinity);
  const choiceLines = choices.map((choice) => lines(choice, 22, Infinity));
  const choiceY = Math.max(590, 300 + titleLines.length * 46);
  const rowHeight = Math.max(
    55,
    ...choiceLines.map((value) => value.length * 30 + 25),
  );
  const height = Math.max(
    850,
    choiceY + Math.ceil(choices.length / 3) * rowHeight + 100,
  );
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="${height}" viewBox="0 0 1200 ${height}"><rect width="1200" height="${height}" rx="32" fill="#fbf0e3"/><path d="M0 ${height - 190}Q220 ${height - 350} 440 ${height - 190}T880 ${height - 200}T1200 ${height - 240}V${height}H0Z" fill="#eac3b5" opacity=".6"/><circle cx="1000" cy="140" r="65" fill="#edcf91" opacity=".8"/><text x="600" y="160" text-anchor="middle" font-family="Georgia,serif" font-size="47" fill="#765a55">our next little adventure</text>${titleLines
    .map(
      (line, i) =>
        `<text x="600" y="${260 + i * 46}" text-anchor="middle" font-family="Georgia,serif" font-size="31" fill="#8f6264">${xml(line)}</text>`,
    )
    .join(
      "",
    )}<path d="M180 ${choiceY - 70}Q600 ${choiceY - 170} 1020 ${choiceY - 70}" fill="none" stroke="#ae8981" stroke-width="2" stroke-dasharray="6 8"/>${choiceLines.map((choice, i) => choice.map((line, j) => `<text x="${260 + (i % 3) * 340}" y="${choiceY + Math.floor(i / 3) * rowHeight + j * 30}" text-anchor="middle" font-family="Georgia,serif" font-size="24" fill="#765a55">${xml(line)}</text>`).join("")).join("")}<text x="600" y="${height - 70}" text-anchor="middle" fill="#a36d75" font-family="Georgia,serif" font-size="26">a little day to dream about, together ♡</text></svg>`;
}
export async function downloadPostcard(
  svg: string,
  filename: string,
  width: number,
  height?: number,
) {
  const source = URL.createObjectURL(
    new Blob([svg], { type: "image/svg+xml;charset=utf-8" }),
  );
  try {
    const image = new Image();
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () =>
        reject(
          new Error("The postcard could not be rendered. Please try again."),
        );
      image.src = source;
    });
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height ?? image.naturalHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Your browser could not create a postcard.");
    ctx.drawImage(image, 0, 0, width, canvas.height);
    const blob = await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob(
        (blob) =>
          blob ? resolve(blob) : reject(new Error("PNG export failed.")),
        "image/png",
      ),
    );
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  } finally {
    URL.revokeObjectURL(source);
  }
}
