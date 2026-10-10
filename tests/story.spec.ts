import { test, expect } from "./fixtures";
test("3D photo controls survive remounts without React root cleanup errors", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  const photo = page.locator("#home .three-photo-hit").first();
  await expect(photo).toBeVisible();
  const bounds = await photo.boundingBox();
  expect(bounds?.width).toBeGreaterThan(80);
  expect(bounds?.height).toBeGreaterThan(100);
  await page.mouse.click(
    bounds!.x + bounds!.width / 2,
    bounds!.y + bounds!.height / 2,
  );
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await page.locator("#memories").scrollIntoViewIfNeeded();
  await expect(
    page.locator("#memories .three-photo-hit").first(),
  ).toBeVisible();
  for (let cycle = 0; cycle < 2; cycle++) {
    await page.setViewportSize({ width: 390, height: 844 });
    await expect(page.locator("#home canvas")).toHaveCount(0);
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.locator("#home").scrollIntoViewIfNeeded();
    await expect(photo).toBeVisible();
  }
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(page.locator("#home canvas")).toHaveCount(0);
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await expect(photo).toBeVisible();
  await page.locator(".site-footer a[href='/admin']").click();
  await expect(page).toHaveURL(/\/admin/);
  await page.goBack();
  await page.locator("#home").scrollIntoViewIfNeeded();
  await expect(photo).toBeVisible();
  expect(errors).toEqual([]);
});
test("sky loads without runtime errors, fits the screen, and story navigation works", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Rashika,",
  );
  await expect(
    page.getByRole("link", { name: "Chalo, dekho" }),
  ).toBeVisible();
  if ((page.viewportSize()?.width || 1440) > 640) {
    await expect
      .poll(() => page.locator("#home .three-photo-hit").count(), {
        timeout: 20000,
      })
      .toBe(6);
    await expect(page.locator("#home canvas")).toBeVisible();
  } else {
    await expect(page.locator("#home .scene-fallback .polaroid")).toHaveCount(
      6,
    );
    await expect(page.locator("#home canvas")).toHaveCount(0);
  }
  expect(
    await page.evaluate(() => document.body.scrollWidth <= innerWidth),
  ).toBe(true);
  await page.getByRole("link", { name: "Chalo, dekho" }).click();
  await expect(page).toHaveURL(/#story/);
  await expect(page.getByText("Phir tum aa gayi.")).toBeVisible();
  expect(errors).toEqual([]);
});
test("floating photo opens with keyboard and Escape restores focus", async ({
  page,
}) => {
  await page.goto("/");
  if ((page.viewportSize()?.width || 1440) > 640)
    await expect(page.locator("#home .three-photo-hit").first()).toBeVisible();
  const photo = page
    .locator("#home")
    .getByRole("button", { name: /^Open A little sunshine/ });
  await expect(photo).toBeVisible();
  await photo.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(
    page.getByRole("dialog").getByText("Sample photograph", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Next memory" }).click();
  await expect(page.getByRole("dialog").getByRole("heading")).toHaveText(
    "Where the sky meets the sea",
  );
  await page.getByRole("button", { name: "Previous memory" }).click();
  await expect(page.getByRole("dialog").getByRole("heading")).toHaveText(
    "A little sunshine",
  );
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(photo).toBeFocused();
});
test("notes unfold, flowers reveal a thought, and final surprise opens", async ({
  page,
}) => {
  await page.goto("/");
  const note = page.getByRole("button", { name: /Tumhari smile/ });
  await note.click();
  await expect(note).toHaveAttribute("aria-expanded", "true");
  await expect(note).toContainText("main bhi smile karne lagta hoon");
  await note.click();
  await expect(note).toHaveAttribute("aria-expanded", "false");
  await page.getByRole("button", { name: "Pick flower 1" }).click();
  await expect(page.getByRole("dialog")).toContainText(
    "Flowers tumhare, aur ek smile mere liye",
  );
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Ek aur chhota surprise" }).click();
  await expect(page.getByRole("dialog").getByRole("heading")).toHaveText(
    "Rashika, tumhara message aata hai na, toh phone dekh ke smile aa jaati hai. Bas, itni si baat thi. ♡",
  );
  await page.getByRole("button", { name: "Close dialog" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
});
test("letter opens, is readable, closes and reopens", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: /^Open your letter/ }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.getByRole("dialog").getByRole("heading")).toHaveText(
    "Rashika, suno na...",
  );
  await expect(page.getByRole("dialog")).toContainText(
    "Smile karo, Rashika",
  );
  await page.getByRole("button", { name: "Close dialog" }).click();
  await page.getByRole("button", { name: "Message padho" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
});
test("gallery filters work and opens full memories", async ({ page }) => {
  await page.goto("/");
  await page
    .locator("#gallery")
    .getByRole("button", { name: "Khuli hawa", exact: true })
    .click();
  await expect(page.locator(".gallery-grid .polaroid")).toHaveCount(3);
  await page.locator(".gallery-grid .polaroid").first().click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Saari yaadein", exact: true }).click();
  await expect(page.locator(".gallery-grid .polaroid")).toHaveCount(6);
});
test("reduced motion stays usable and no sound plays automatically", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(
    page.getByRole("button", { name: /^Turn sound on/ }),
  ).toHaveAttribute("aria-pressed", "false");
  expect(
    await page
      .locator(".envelope")
      .evaluate((e) => getComputedStyle(e).animationName),
  ).toBe("none");
  await page.getByRole("button", { name: /^Open your letter/ }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: /^Turn sound on/ }).click();
  await expect(
    page.getByRole("button", { name: /^Turn sound off/ }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: /^Turn sound off/ }).click();
});
test("private APIs reject unauthenticated and cross-origin mutations", async ({
  request,
}) => {
  expect((await request.get("/api/admin/memories")).status()).toBe(401);
  expect(
    (
      await request.post("/api/admin/apify", { data: { mode: "dataset" } })
    ).status(),
  ).toBe(401);
  expect(
    (
      await request.post("/api/admin/session", {
        headers: { origin: "https://example.org" },
        data: { password: "test-only-studio-password-12345678" },
      })
    ).status(),
  ).toBe(403);
  expect(
    (await request.post("/api/apify/webhook", { data: {} })).status(),
  ).toBe(401);
});
test("devices without WebGL still have accessible working photographs", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    Object.defineProperty(HTMLCanvasElement.prototype, "getContext", {
      value: function (type: string, ...args: unknown[]) {
        if (type.startsWith("webgl")) return null;
        return Reflect.apply(original, this, [type, ...args]);
      },
    });
  });
  await page.goto("/");
  const photo = page.locator("#home .scene-fallback .polaroid").first();
  if ((page.viewportSize()?.width || 1440) > 640)
    await page.waitForTimeout(1000);
  await expect(photo).toBeVisible();
  await photo.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
});
test("admin upload stays unpublished until approved; caption edits, hiding, and removal work", async ({
  page,
  request,
}) => {
  await page.goto("/admin");
  await page
    .getByLabel("Studio password")
    .fill("test-only-studio-password-12345678");
  await page.getByRole("button", { name: "Open the studio" }).click();
  await expect(
    page.getByRole("heading", { name: "Bring your memories in" }),
  ).toBeVisible();
  await page
    .locator("input[type=file]")
    .setInputFiles("public/images/memory-3.jpg");
  await expect(page.locator(".admin-memory")).toHaveCount(1);
  const card = page.locator(".admin-memory").first();
  await card.getByLabel("Title", { exact: true }).fill("Test memory");
  await card.getByLabel("Handwritten caption").fill("a test caption");
  await card.getByRole("button", { name: "Save edits" }).click();
  await expect(card.getByRole("status")).toHaveText("Saved.");
  expect(
    (await (await request.get("/api/memories")).json()).every(
      (m: { demo?: boolean }) => m.demo,
    ),
  ).toBe(true);
  const uploaded = (
    await (await page.request.get("/api/admin/memories")).json()
  )[0];
  expect((await request.get(uploaded.mediaUrl)).status()).toBe(404);
  expect((await page.request.get(uploaded.mediaUrl)).status()).toBe(200);
  await card.getByRole("button", { name: "Preview", exact: true }).click();
  await expect(page.getByRole("dialog")).toContainText("a test caption");
  await page.keyboard.press("Escape");
  await card.getByRole("button", { name: "Approve & publish" }).click();
  await expect(card.getByText("Published", { exact: true })).toBeVisible();
  await expect
    .poll(async () => {
      const m = await (await request.get("/api/memories")).json();
      return m[0].caption;
    })
    .toBe("a test caption");
  expect((await request.get(uploaded.mediaUrl)).status()).toBe(200);
  await card.getByRole("button", { name: "Hide", exact: true }).click();
  await expect(
    card.getByText("Awaiting review", { exact: true }),
  ).toBeVisible();
  expect((await request.get(uploaded.mediaUrl)).status()).toBe(404);
  await card.getByRole("button", { name: "Remove memory" }).click();
  await card.getByRole("button", { name: "Remove", exact: true }).click();
  await expect(page.locator(".admin-memory")).toHaveCount(0);
});
test("approved video opens with poster, loads, plays, and closes", async ({
  page,
  baseURL,
}) => {
  await page.route("https://media.example.test/clip.mp4", (route) =>
    route.fulfill({
      path: "universe_landing_motion.mp4",
      contentType: "video/mp4",
      headers: { "Access-Control-Allow-Origin": "*" },
    }),
  );
  await page.route("https://media.example.test/poster.jpg", (route) =>
    route.fulfill({
      path: "public/images/memory-2.jpg",
      contentType: "image/jpeg",
      headers: { "Access-Control-Allow-Origin": "*" },
    }),
  );
  const session = await page.request.post("/api/admin/session", {
    headers: { origin: baseURL! },
    data: { password: "test-only-studio-password-12345678" },
  });
  expect(session.ok()).toBe(true);
  const added = await page.request.post("/api/admin/memories", {
    headers: { origin: baseURL! },
    data: {
      kind: "video",
      title: "Test video",
      mediaUrl: "https://media.example.test/clip.mp4",
      thumbnailUrl: "https://media.example.test/poster.jpg",
    },
  });
  expect(added.ok()).toBe(true);
  const memory = await added.json();
  try {
    await page.request.patch(`/api/admin/memories/${memory.id}`, {
      headers: { origin: baseURL! },
      data: { approved: true },
    });
    await page.goto("/");
    await page
      .locator("#gallery")
      .getByRole("button", { name: "Open Test video" })
      .click();
    const video = page.getByRole("dialog").locator("video");
    await expect(video).toHaveAttribute("controls", "");
    await expect(video).toHaveAttribute(
      "poster",
      "https://media.example.test/poster.jpg",
    );
    await expect
      .poll(() => video.evaluate((v: HTMLVideoElement) => v.readyState))
      .toBeGreaterThanOrEqual(1);
    await video.evaluate((v: HTMLVideoElement) => v.play());
    await expect
      .poll(() => video.evaluate((v: HTMLVideoElement) => v.currentTime))
      .toBeGreaterThan(0);
    await page.evaluate(() => {
      Object.defineProperty(document, "hidden", {
        configurable: true,
        value: true,
      });
      document.dispatchEvent(new Event("visibilitychange"));
    });
    await expect
      .poll(() => video.evaluate((v: HTMLVideoElement) => v.paused))
      .toBe(true);
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toHaveCount(0);
  } finally {
    await page.request.delete(`/api/admin/memories/${memory.id}`, {
      headers: { origin: baseURL! },
    });
  }
});
