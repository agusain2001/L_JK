import {
  test,
  expect,
  type Page,
  type APIRequestContext,
} from "./fixtures";
import sharp from "sharp";
import { readFile, mkdir } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { emptyProgress } from "../src/lib/games/schemas";
const origin = "http://127.0.0.1:3001",
  headers = { Origin: origin };
const ids = [
  "letters",
  "voice",
  "today",
  "mood",
  "notes",
  "map",
  "dates",
  "capsules",
  "bucket-list",
  "music",
  "photo-booth",
  "companion",
  "garden",
  "surprise",
  "keepsakes",
];
async function owner(request: APIRequestContext) {
  const response = await request.post("/api/admin/session", {
    headers: { ...headers, "x-forwarded-for": `world-${randomUUID()}` },
    data: { password: "test-only-studio-password-12345678" },
  });
  expect(response.status()).toBe(200);
  await request.get("/api/world");
}
async function editorial(
  request: APIRequestContext,
  data: unknown,
  entity = "content",
) {
  const response = await request.post("/api/admin/world", {
    headers,
    data: { entity, data },
  });
  expect(response.status(), await response.text()).toBe(200);
  return response.json();
}
async function feature(page: Page, id: string, selector: string) {
  await page.goto(`/world/${id}`);
  await expect(page.locator(selector).first()).toBeVisible();
  await expect(page.locator(".world-feature")).toHaveAttribute(
    "data-world-ready",
    "true",
  );
}
test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
});
test("all fifteen features render without overflow or runtime errors on both screen sizes", async ({
  page,
}, testInfo) => {
  test.setTimeout(180000);
  await owner(page.request);
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/world");
  await expect(page.locator(".world-object")).toHaveCount(15);
  const selectors = [
    ".envelope-collection",
    ".cassette-library",
    ".daily-corner",
    ".mood-options",
    ".private-writing",
    ".memory-map",
    ".paper-calendar",
    ".capsule-collection",
    ".bucket-notebook",
    ".cassette-library",
    ".booth-canvas",
    ".companion-introduction",
    ".garden-bed",
    ".surprise-mode",
    ".keepsake-box",
  ];
  await mkdir(`verification/world-${testInfo.project.name}`, {
    recursive: true,
  });
  await page.screenshot({
    path: `verification/world-${testInfo.project.name}/hub.png`,
    fullPage: true,
  });
  for (let index = 0; index < ids.length; index++) {
    await feature(page, ids[index], selectors[index]);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      `Overflow in ${ids[index]}`,
    ).toBe(true);
    await page.screenshot({
      path: `verification/world-${testInfo.project.name}/${ids[index]}.png`,
      fullPage: true,
    });
  }
  expect(errors).toEqual([]);
});
test("letters, daily notes, moods, random memories, calendar and real map controls work", async ({
  page,
}) => {
  await feature(page, "letters", ".world-envelope");
  await expect(page.locator(".world-envelope")).toHaveCount(8);
  await page.locator(".world-envelope").first().focus();
  await page.keyboard.press("Enter");
  await expect(page.locator(".opened-letter .letter-copy")).not.toBeEmpty();
  await page.getByRole("link", { name: "Fold this letter & return" }).click();
  await expect(page.locator(".world-envelope")).toHaveCount(8);
  await feature(page, "today", ".daily-fold");
  await page.locator(".daily-fold").click();
  const copy = await page.locator(".letter-copy").innerText();
  await page.reload();
  await page.locator(".daily-fold").click();
  await expect(page.locator(".letter-copy")).toHaveText(copy);
  await page.locator(".daily-archive summary").click();
  await page.locator(".daily-archive button").last().click();
  await expect(page.locator(".unfolded-paper")).toBeVisible();
  await feature(page, "mood", ".mood-options");
  await page.getByRole("button", { name: "Tired", exact: true }).click();
  await expect(
    page.getByRole("region", { name: "Your curated surprise" }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("region", { name: "Your curated surprise" }),
  ).toHaveCount(0);
  await feature(page, "surprise", ".surprise-mode");
  await page.getByRole("button", { name: "Surprise me", exact: true }).click();
  const first = await page
    .locator(".surprise-polaroid img")
    .getAttribute("src");
  await page
    .getByRole("button", { name: "Another memory", exact: true })
    .click();
  expect(
    await page.locator(".surprise-polaroid img").getAttribute("src"),
  ).not.toBe(first);
  await page.getByRole("button", { name: "View full story" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await page.getByLabel("Today's memory").check();
  await page.getByRole("button", { name: "Show today's memory" }).click();
  const today = await page
    .locator(".surprise-polaroid img")
    .getAttribute("src");
  await page.reload();
  await page.getByLabel("Today's memory").check();
  await page.getByRole("button", { name: "Show today's memory" }).click();
  expect(await page.locator(".surprise-polaroid img").getAttribute("src")).toBe(
    today,
  );
  await feature(page, "dates", ".paper-calendar");
  const month = await page.locator(".calendar-heading h2").innerText();
  await page.getByRole("button", { name: "Next month" }).click();
  expect(await page.locator(".calendar-heading h2").innerText()).not.toBe(
    month,
  );
  await page.getByRole("button", { name: "Previous month" }).click();
  await expect(page.locator(".calendar-heading h2")).toHaveText(month);
  await feature(page, "map", ".memory-map");
  await expect(page.locator(".leaflet-control-zoom-in")).toBeVisible();
  await page.locator(".leaflet-control-zoom-in").click();
  await page.locator(".location-list button").first().click();
  await expect(page.locator(".map-locations .unfolded-paper")).toBeVisible();
  await page
    .locator(".map-locations .unfolded-paper .world-polaroid")
    .first()
    .click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
});
test("audio is real, seeking and replay work, voice memories pause other players", async ({
  page,
}) => {
  await feature(page, "voice", ".cassette-card");
  await page.locator(".cassette-card").first().click();
  await expect(page.locator(".world-audio")).toBeVisible();
  const file = await page.request.get("/api/world/media/demo-chime");
  expect(file.status()).toBe(200);
  expect((await file.body()).subarray(0, 4).toString()).toBe("RIFF");
  await page
    .getByRole("button", { name: "Play Original sample chime", exact: true })
    .click();
  await expect(
    page.getByRole("button", {
      name: "Pause Original sample chime",
      exact: true,
    }),
  ).toBeVisible();
  await expect
    .poll(() =>
      page.locator("audio").evaluate((node: HTMLAudioElement) => node.duration),
    )
    .toBe(2);
  await page
    .getByRole("button", { name: "Replay Original sample chime" })
    .click();
  await page.getByLabel("Recording progress").fill("1");
  await page.getByLabel("Volume for Original sample chime").fill("0.2");
  expect(
    await page
      .locator("audio")
      .evaluate((node: HTMLAudioElement) => node.volume),
  ).toBe(0.2);
  await page.locator(".world-photo-row button").first().click();
  await page.getByRole("button", { name: "Hear the voice memory" }).click();
  const inside = page.getByRole("dialog");
  await inside
    .getByRole("button", { name: "Play Original sample chime", exact: true })
    .click();
  await expect
    .poll(() =>
      page
        .locator("audio")
        .evaluateAll(
          (nodes) =>
            nodes.filter((node) => !(node as HTMLAudioElement).paused).length,
        ),
    )
    .toBe(1);
  await page.keyboard.press("Escape");
  await expect
    .poll(() =>
      page
        .locator("audio")
        .evaluateAll(
          (nodes) =>
            nodes.filter((node) => !(node as HTMLAudioElement).paused).length,
        ),
    )
    .toBe(0);
});
test("photo booth keeps drafts across links, exports actual PNG strips and saves privately", async ({
  page,
}) => {
  await owner(page.request);
  await feature(page, "photo-booth", ".booth-canvas");
  await page.getByLabel("Upload photo booth photograph").setInputFiles({
    name: "picture.png",
    mimeType: "image/png",
    buffer: await sharp({
      create: { width: 320, height: 240, channels: 3, background: "#d25b75" },
    })
      .png()
      .toBuffer(),
  });
  await expect(page.getByRole("status")).toContainText("on this device only");
  await page.getByLabel("Photo caption").fill("A real little picture");
  await page.getByLabel("Photo frame").selectOption("strip");
  await page
    .getByRole("link", { name: "Our little world", exact: true })
    .click();
  await page.locator('a[href="/world/photo-booth"]').click();
  await expect(page.getByLabel("Photo caption")).toHaveValue(
    "A real little picture",
  );
  await expect(page.getByLabel("Photo frame")).toHaveValue("strip");
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("button", { name: "Download PNG", exact: true }).click(),
  ]);
  const bytes = await readFile((await download.path())!);
  const metadata = await sharp(bytes).metadata();
  expect(metadata.format).toBe("png");
  expect(metadata.width).toBe(600);
  expect(metadata.height).toBe(1900);
  const pixels = await sharp(bytes)
    .extract({ left: 100, top: 100, width: 1, height: 1 })
    .raw()
    .toBuffer();
  expect(pixels[0]).toBeGreaterThan(180);
  expect(pixels[1]).toBeLessThan(120);
  await page
    .getByRole("button", { name: "Save privately to my drawer" })
    .click();
  await expect(page.getByRole("status")).toContainText("Saved privately");
  const saved = await (await page.request.get("/api/world/keepsakes")).json();
  const assetId = saved.booth.at(-1).assetId;
  const guest = await page.context().browser()!.newContext();
  expect(
    (await guest.request.get(`${origin}/api/world/media/${assetId}`)).status(),
  ).toBe(404);
  await guest.close();
  await page.getByRole("button", { name: "Discard & create another" }).click();
  await expect(
    page.getByRole("button", { name: "Download PNG", exact: true }),
  ).toBeDisabled();
  await page.request.delete(`/api/world/media/${assetId}`, { headers });
  expect((await page.request.get(`/api/world/media/${assetId}`)).status()).toBe(
    404,
  );
});
test("camera denial gives upload fallback and camera capture stops its tracks", async ({
  page,
  context,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator.mediaDevices, "getUserMedia", {
      configurable: true,
      value: async () => {
        throw new DOMException("Denied", "NotAllowedError");
      },
    });
  });
  await feature(page, "photo-booth", ".booth-canvas");
  await page.getByRole("button", { name: "Take a photo" }).click();
  await expect(page.getByRole("status")).toContainText("still upload");
  await expect(
    page.getByRole("button", { name: "Upload a photo", exact: true }),
  ).toBeEnabled();
  await context.addInitScript(() => {
    Object.defineProperty(navigator.mediaDevices, "getUserMedia", {
      configurable: true,
      value: async () => {
        const canvas = document.createElement("canvas");
        canvas.width = 640;
        canvas.height = 480;
        canvas.getContext("2d")!.fillRect(0, 0, 640, 480);
        const stream = canvas.captureStream(10);
        (window as unknown as { testCamera: MediaStream }).testCamera = stream;
        return stream;
      },
    });
  });
  await page.reload();
  await page.getByRole("button", { name: "Take a photo" }).click();
  await expect(page.locator(".camera-view video")).toBeVisible();
  await expect
    .poll(() =>
      page
        .locator(".camera-view video")
        .evaluate((node: HTMLVideoElement) => node.videoWidth),
    )
    .toBeGreaterThan(0);
  await page.getByRole("button", { name: "Capture a photograph" }).click();
  await expect(
    page.getByRole("button", { name: "Download PNG", exact: true }),
  ).toBeEnabled();
  expect(
    await page.evaluate(() =>
      (window as unknown as { testCamera: MediaStream }).testCamera
        .getTracks()
        .every((track) => track.readyState === "ended"),
    ),
  ).toBe(true);
});
test("invitations create distinct recipients and capsule payloads, media and coordinates stay private", async ({
  page,
  browser,
}) => {
  await owner(page.request);
  const invited = await page.request.post("/api/world/invitations", {
    headers,
    data: { action: "invite", email: `recipient-${randomUUID()}@example.com` },
  });
  expect(invited.status()).toBe(200);
  const invite = await invited.json();
  const recipient = await browser.newContext({ baseURL: origin });
  const guest = await browser.newContext({ baseURL: origin });
  const recipientPage = await recipient.newPage();
  try {
    await recipientPage.goto(invite.url);
    await recipientPage.getByLabel("Your name").fill("Invited reader");
    await recipientPage
      .getByLabel("Your password")
      .fill("a-private-reader-password");
    await recipientPage
      .getByRole("button", { name: "Accept my invitation" })
      .click();
    await expect(recipientPage).toHaveURL(/\/world$/);
    const who = (await (await recipient.request.get("/api/world")).json())
      .actor;
    expect(who.role).toBe("recipient");
    expect(who.id).not.toBe("site-owner");
    const bonusUpload = await page.request.post("/api/world/upload", {
      headers,
      multipart: {
        purpose: "editorial",
        file: {
          name: "bonus.wav",
          mimeType: "audio/wav",
          buffer: await (
            await page.request.get("/api/world/media/demo-chime")
          ).body(),
        },
      },
    });
    expect(bonusUpload.status()).toBe(201);
    const bonusAsset = await bonusUpload.json();
    await editorial(
      page.request,
      {
        id: bonusAsset.id,
        title: "Private bonus recording",
        approved: true,
        audience: "private",
        recipientId: who.id,
      },
      "asset",
    );
    const bonus = await editorial(page.request, {
      kind: "rewards",
      title: "A secret bonus letter",
      body: "A bonus after the quiz",
      enabled: true,
      audience: "private",
      recipientId: who.id,
      metadata: { gameId: "quiz" },
      assetIds: [bonusAsset.id],
    });
    expect(
      (await recipient.request.get(`/api/world/content/${bonus.id}`)).status(),
    ).toBe(404);
    expect(
      (
        await recipient.request.get(`/api/world/media/${bonusAsset.id}`)
      ).status(),
    ).toBe(404);
    expect(
      (await (await recipient.request.get("/api/world")).json()).content.some(
        (content: { id: string }) => content.id === bonus.id,
      ),
    ).toBe(false);
    const completed = emptyProgress();
    completed.completedGameIds = ["quiz"];
    completed.quizResults = [{ score: 2, total: 2 }];
    expect(
      (
        await recipient.request.post("/api/world/keepsakes", {
          headers,
          data: { action: "progress", progress: completed },
        })
      ).status(),
    ).toBe(200);
    expect(
      (await recipient.request.get(`/api/world/content/${bonus.id}`)).status(),
    ).toBe(200);
    expect(
      (
        await recipient.request.get(`/api/world/media/${bonusAsset.id}`)
      ).status(),
    ).toBe(200);
    expect(
      (
        await (await recipient.request.get("/api/world/keepsakes")).json()
      ).items.some(
        (item: { contentId: string }) => item.contentId === bonus.id,
      ),
    ).toBe(true);
    await page.request.delete("/api/admin/world", {
      headers,
      data: { entity: "content", id: bonus.id },
    });
    await page.request.delete(`/api/world/media/${bonusAsset.id}`, { headers });
    expect(
      (
        await guest.request.post("/api/auth/sign-up/email", {
          headers,
          data: {
            email: "rogue@example.com",
            password: "rogue-password-is-long",
            name: "Rogue",
          },
        })
      ).status(),
    ).toBe(403);
    const payload = `secret-${randomUUID()}`;
    const capsule = await editorial(page.request, {
      kind: "capsules",
      title: "Private future package",
      body: payload,
      enabled: true,
      audience: "private",
      recipientId: who.id,
      unlockAt: "2099-01-01T00:00:00Z",
      memoryIds: ["demo-1"],
    });
    const location = await editorial(
      page.request,
      {
        title: "Private exact place",
        description: "Only invited",
        latitude: 28.613955,
        longitude: 77.209133,
        precision: "hidden",
        enabled: true,
        audience: "private",
        recipientId: who.id,
        memoryIds: ["demo-1"],
      },
      "location",
    );
    const manifest = await (await recipient.request.get("/api/world")).json();
    const locked = manifest.content.find(
      (row: { id: string }) => row.id === capsule.id,
    );
    expect(locked.locked).toBe(true);
    expect(locked.body).toBeUndefined();
    expect(locked.memoryIds).toEqual([]);
    expect(locked.assets).toEqual([]);
    expect(JSON.stringify(manifest)).not.toContain(payload);
    expect(
      manifest.locations.find((row: { id: string }) => row.id === location.id)
        .latitude,
    ).toBeNull();
    expect(
      (
        await recipient.request.get(`/api/world/content/${capsule.id}`)
      ).status(),
    ).toBe(404);
    expect(
      (await guest.request.get(`/api/world/content/${capsule.id}`)).status(),
    ).toBe(404);
    await recipientPage.goto("/world/capsules");
    expect(await recipientPage.content()).not.toContain(payload);
    await editorial(page.request, {
      id: capsule.id,
      kind: "capsules",
      title: "Private future package",
      body: payload,
      enabled: true,
      audience: "private",
      recipientId: who.id,
      unlockAt: "2020-01-01T00:00:00Z",
    });
    const released = await recipient.request.get(
      `/api/world/content/${capsule.id}`,
    );
    expect(released.status()).toBe(200);
    expect((await released.json()).body).toBe(payload);
    expect(
      (
        await recipient.request.post(`/api/world/content/${capsule.id}`, {
          headers,
        })
      ).status(),
    ).toBe(200);
    await editorial(page.request, {
      id: capsule.id,
      kind: "capsules",
      title: "Private future package",
      body: payload,
      enabled: true,
      audience: "private",
      recipientId: who.id,
      unlockAt: "2020-01-01T00:00:00Z",
      status: "revoked",
    });
    expect(
      (
        await recipient.request.get(`/api/world/content/${capsule.id}`)
      ).status(),
    ).toBe(404);
    await page.request.delete("/api/admin/world", {
      headers,
      data: { entity: "content", id: capsule.id },
    });
    await page.request.delete("/api/admin/world", {
      headers,
      data: { entity: "location", id: location.id },
    });
    expect((await guest.request.get("/api/world/notes")).status()).toBe(401);
    await page.request.delete("/api/world/invitations", {
      headers,
      data: { userId: who.id },
    });
    expect(
      (await (await recipient.request.get("/api/world")).json()).actor,
    ).toBeNull();
  } finally {
    await recipient.close();
    await guest.close();
  }
});
test("shared notebook persists, reorders atomically and grows only authenticated milestone flowers", async ({
  page,
  browser,
}) => {
  await owner(page.request);
  await feature(page, "bucket-list", ".bucket-writing");
  const title = `A real adventure ${randomUUID().slice(0, 8)}`;
  await page.getByLabel("Our idea").fill(title);
  await page.getByRole("button", { name: "Add our idea" }).click();
  await expect(
    page.locator(".bucket-idea").filter({ hasText: title }),
  ).toBeVisible();
  await page.reload();
  await page
    .getByRole("button", { name: `Complete ${title}`, exact: true })
    .click();
  await expect(
    page.locator(".bucket-idea").filter({ hasText: title }),
  ).toContainText("One more beautiful memory made");
  const state = await (await page.request.get("/api/world")).json();
  expect(
    state.flowers.filter((flower: { label: string }) => flower.label === title),
  ).toHaveLength(1);
  const guest = await browser.newContext({ baseURL: origin });
  expect(
    (await (await guest.request.get("/api/world")).json()).flowers.some(
      (flower: { label: string }) => flower.label === title,
    ),
  ).toBe(false);
  await guest.close();
  const second = await (
    await page.request.post("/api/world/bucket-list", {
      headers,
      data: { title: "Second adventure", order: 99 },
    })
  ).json();
  let items = await (await page.request.get("/api/world/bucket-list")).json();
  const reordered = await page.request.post("/api/world/bucket-list", {
    headers,
    data: {
      action: "reorder",
      ids: items.map((row: { id: string }) => row.id).reverse(),
    },
  });
  expect(reordered.status()).toBe(200);
  items = await (await page.request.get("/api/world/bucket-list")).json();
  expect(items[0].id).toBe(second.id);
  await page
    .getByRole("button", { name: `Reopen ${title}`, exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: `Complete ${title}`, exact: true }),
  ).toBeVisible();
  expect(
    (await (await page.request.get("/api/world")).json()).flowers.some(
      (flower: { label: string }) => flower.label === title,
    ),
  ).toBe(false);
  await page
    .getByRole("button", { name: `Delete ${title}`, exact: true })
    .click();
  await page.request.delete("/api/world/bucket-list", {
    headers,
    data: { id: second.id },
  });
});
test("private notes deliver between distinct users, paginate, rate-limit and delete for both people", async ({
  page,
  browser,
}) => {
  await owner(page.request);
  const invite = await (
    await page.request.post("/api/world/invitations", {
      headers,
      data: { action: "invite", email: `mail-${randomUUID()}@example.com` },
    })
  ).json();
  const participant = await browser.newContext({ baseURL: origin });
  try {
    const accepted = await participant.request.post("/api/world/invitations", {
      headers,
      data: {
        token: new URL(invite.url, origin).searchParams.get("invite"),
        name: "Mailbox reader",
        password: "private-mailbox-password",
      },
    });
    expect(accepted.status()).toBe(200);
    const who = (await (await participant.request.get("/api/world")).json())
      .actor;
    expect(who).not.toBeNull();
    const deliveries: { id: string; body: string }[] = [];
    const submissionKey = randomUUID();
    for (let i = 0; i < 5; i++) {
      const response = await participant.request.post("/api/world/notes", {
        headers,
        data: {
          recipientId: "site-owner",
          body: `Private note ${i} ${randomUUID()}`,
          sticker: "heart",
          ...(i === 0 ? { submissionKey } : {}),
        },
      });
      expect(response.status()).toBe(201);
      deliveries.push(await response.json());
    }
    const repeated = await participant.request.post("/api/world/notes", {
      headers,
      data: {
        recipientId: "site-owner",
        body: deliveries[0].body,
        sticker: "heart",
        submissionKey,
      },
    });
    expect(repeated.status()).toBe(201);
    expect((await repeated.json()).id).toBe(deliveries[0].id);
    const firstPage = await (
      await participant.request.get("/api/world/notes?limit=2")
    ).json();
    expect(firstPage.items).toHaveLength(2);
    expect(firstPage.nextCursor).toBeTruthy();
    const secondPage = await (
      await participant.request.get(
        `/api/world/notes?limit=2&cursor=${firstPage.nextCursor}`,
      )
    ).json();
    expect(
      secondPage.items.every(
        (note: { id: string }) =>
          !firstPage.items.some(
            (first: { id: string }) => first.id === note.id,
          ),
      ),
    ).toBe(true);
    expect(
      (
        await participant.request.post("/api/world/notes", {
          headers,
          data: { recipientId: "site-owner", body: "Sixth note" },
        })
      ).status(),
    ).toBe(429);
    const received = await (await page.request.get("/api/world/notes")).json();
    expect(
      received.items.some(
        (note: { id: string }) => note.id === deliveries[0].id,
      ),
    ).toBe(true);
    const outsider = await browser.newContext({ baseURL: origin });
    expect((await outsider.request.get("/api/world/notes")).status()).toBe(401);
    await outsider.close();
    await feature(page, "notes", ".private-writing");
    await expect(
      page.locator(".private-paper").filter({ hasText: deliveries[0].body }),
    ).toBeVisible();
    await page
      .locator(".private-paper")
      .filter({ hasText: deliveries[0].body })
      .getByRole("button", { name: "Reply", exact: true })
      .click();
    await page
      .getByLabel("Your private note")
      .fill("A reply that was actually delivered");
    await page.getByRole("button", { name: "Send my little note" }).click();
    await expect(page.getByRole("status")).toContainText("has reached");
    const reply = await (
      await participant.request.get("/api/world/notes")
    ).json();
    expect(
      reply.items.some(
        (note: { replyToId: string }) => note.replyToId === deliveries[0].id,
      ),
    ).toBe(true);
    await participant.request.delete("/api/world/notes", {
      headers,
      data: { id: deliveries[0].id },
    });
    expect(
      (await (await page.request.get("/api/world/notes")).json()).items.some(
        (note: { id: string }) => note.id === deliveries[0].id,
      ),
    ).toBe(false);
  } finally {
    await participant.close();
  }
});
test("private media review, capsule byte ranges, independent flags and owner CMS are enforced", async ({
  page,
  browser,
}) => {
  await owner(page.request);
  const guest = await browser.newContext({ baseURL: origin });
  const studio = await (await page.request.get("/api/admin/world")).json();
  const upload = await page.request.post("/api/world/upload", {
    headers,
    multipart: {
      purpose: "editorial",
      file: {
        name: "original.wav",
        mimeType: "audio/wav",
        buffer: await (
          await page.request.get("/api/world/media/demo-chime")
        ).body(),
      },
    },
  });
  expect(upload.status()).toBe(201);
  const asset = await upload.json();
  expect(
    (await guest.request.get(`/api/world/media/${asset.id}`)).status(),
  ).toBe(404);
  await editorial(
    page.request,
    {
      id: asset.id,
      title: "Reviewed recording",
      approved: true,
      audience: "private",
    },
    "asset",
  );
  const secret = await editorial(page.request, {
    kind: "capsules",
    title: "Audio package",
    body: "A recording",
    enabled: true,
    audience: "private",
    unlockAt: "2099-01-01T00:00:00Z",
    assetIds: [asset.id],
  });
  expect(
    (await guest.request.get(`/api/world/media/${asset.id}`)).status(),
  ).toBe(404);
  await editorial(page.request, { ...studio.settings }, "settings");
  const changed = await page.request.post("/api/admin/world", {
    headers,
    data: {
      entity: "settings",
      data: studio.settings,
      flags: { ...studio.flags, letters: false },
    },
  });
  expect(changed.status()).toBe(200);
  await page.goto("/world");
  await expect(
    page.locator('a.world-object[href="/world/letters"]'),
  ).toHaveCount(0);
  expect(
    (
      await guest.request.get("/api/world/content/demo-letter-missing")
    ).status(),
  ).toBe(404);
  await page.request.post("/api/admin/world", {
    headers,
    data: { entity: "settings", data: studio.settings, flags: studio.flags },
  });
  const range = await page.request.get(`/api/world/media/${asset.id}`, {
    headers: { Range: "bytes=0-15" },
  });
  expect(range.status()).toBe(206);
  expect((await range.body()).length).toBe(16);
  expect(
    (
      await page.request.get(`/api/world/media/${asset.id}`, {
        headers: { Range: "bytes=999999-" },
      })
    ).status(),
  ).toBe(416);
  expect((await guest.request.get("/api/admin/world")).status()).toBe(401);
  await page.goto("/admin");
  await expect(
    page.getByRole("heading", {
      name: "Your Little World studio.",
      exact: true,
    }),
  ).toBeVisible();
  await page
    .locator(".world-editor")
    .getByRole("button", { name: "Feature settings", exact: true })
    .click();
  await expect(page.getByLabel("Website time zone")).toBeVisible();
  await page.request.delete("/api/admin/world", {
    headers,
    data: { entity: "content", id: secret.id },
  });
  await page.request.delete(`/api/world/media/${asset.id}`, { headers });
  await guest.close();
});
test("game completion saves one reward before it can be reopened and reset", async ({
  page,
}) => {
  await owner(page.request);
  await page.goto("/#games");
  await page.locator("#games").scrollIntoViewIfNeeded();
  await page.locator(".game-preview-grid").hover();
  await page
    .getByRole("button", { name: "Play How well do you know us?", exact: true })
    .click();
  for (let i = 0; i < 8; i++) {
    await page.locator(".answer-list button").first().click();
    await page
      .getByRole("button", {
        name: i === 7 ? "See my little surprise" : "Next question",
        exact: true,
      })
      .click();
  }
  await expect(page.locator(".game-completion")).toBeVisible();
  await expect
    .poll(async () => {
      const state = await (
        await page.request.get("/api/world/keepsakes")
      ).json();
      return state.items.filter(
        (item: { sourceKey: string }) => item.sourceKey === "game:quiz",
      ).length;
    })
    .toBe(1);
  const progress = emptyProgress();
  progress.completedGameIds = ["quiz"];
  progress.quizResults = [{ score: 2, total: 2 }];
  await page.request.post("/api/world/keepsakes", {
    headers,
    data: { action: "progress", progress },
  });
  const drawer = await (await page.request.get("/api/world/keepsakes")).json();
  expect(
    drawer.items.filter(
      (item: { sourceKey: string }) => item.sourceKey === "game:quiz",
    ),
  ).toHaveLength(1);
  await feature(page, "keepsakes", ".keepsake-box");
  await page.locator(".keepsake-box").click();
  await expect(
    page
      .locator(".keepsake-object")
      .filter({ hasText: "How well do you know us?" }),
  ).toBeVisible();
  await page
    .locator(".keepsake-object")
    .filter({ hasText: "How well do you know us?" })
    .click();
  await expect(page.locator(".unfolded-paper")).toContainText("paper flower");
  await page.request.delete("/api/world/keepsakes", {
    headers,
    data: { action: "reset-games" },
  });
  expect(
    (
      await (await page.request.get("/api/world/keepsakes")).json()
    ).items.filter((item: { type: string }) => item.type === "game"),
  ).toHaveLength(0);
});
test("cloud hints and preferences, capsule reveal/replay and persistent garden interactions work", async ({
  page,
}) => {
  await feature(page, "companion", ".cloud-character");
  await page
    .getByRole("button", { name: "Ask the tiny cloud for a hint" })
    .click();
  await expect(page.locator(".cloud-speech")).toBeVisible();
  await page.getByRole("button", { name: "Let my cloud rest" }).click();
  await expect(
    page.getByRole("button", { name: "Wake my tiny cloud" }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Wake my tiny cloud" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Wake my tiny cloud" }).click();
  await expect(page.locator(".cloud-character")).toBeVisible();
  await feature(page, "capsules", ".capsule-collection");
  await page
    .getByRole("button", { name: "Open this capsule", exact: true })
    .first()
    .click();
  await expect(page.locator(".capsule-reveal .letter-copy")).not.toBeEmpty();
  const content = await page
    .locator(".capsule-reveal .letter-copy")
    .innerText();
  await page
    .getByRole("button", { name: "Replay the opening", exact: true })
    .click();
  await expect(page.locator(".capsule-reveal .letter-copy")).toHaveText(
    content,
  );
  await feature(page, "garden", ".garden-bed");
  const before = (await (await page.request.get("/api/world")).json()).flowers
    .length;
  await page.locator(".memory-flower").first().click();
  await expect(page.locator(".growing-garden .unfolded-paper")).toBeVisible();
  await page.getByRole("button", { name: "Close this flower" }).click();
  await page
    .getByRole("button", { name: "A little water", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText("just for fun");
  await page.getByRole("button", { name: "See what has grown" }).click();
  expect(
    (await (await page.request.get("/api/world")).json()).flowers.length,
  ).toBe(before);
});
