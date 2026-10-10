import "server-only";
import { db } from "@/lib/db";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { features, defaultWorldSettings } from "./features";
let pending: Promise<void> | undefined;
export function ensureWorld() {
  return (pending ??= (async () => {
    const marker = await db.featureSettings.findUnique({
      where: { key: "world" },
    });
    if (marker) return;
    const ownerId = "site-owner";
    await db.user.upsert({
      where: { id: ownerId },
      create: {
        id: ownerId,
        name: "The owner",
        email: "owner@for-you.invalid",
      },
      update: {},
    });
    const templates = [
      [
        "missing",
        "you're missing me",
        "Let this little page make the distance feel a bit smaller. Take a breath, keep a lovely memory close, and know that this is a little place you can return to.",
      ],
      [
        "difficult",
        "you've had a difficult day",
        "You don't have to make today perfect. A difficult day can be just a difficult day. Give yourself a little room to rest. This letter will still be here.",
      ],
      [
        "smile",
        "you need a smile",
        "Imagine a tiny cloud trying very hard to carry a bouquet. It would probably drop a daisy, blush, and try again. A little silliness, just for this moment.",
      ],
      [
        "proud",
        "you're feeling proud",
        "Make a little space for what you've done. Small things can take a lot of courage. You deserve to enjoy this moment.",
      ],
      [
        "sleep",
        "you can't sleep",
        "Let the rest of the world wait for a moment. This quiet page asks nothing of you. Read it slowly, and rest whenever you're ready.",
      ],
      [
        "thinking",
        "you're overthinking",
        "You don't have to untangle every thought tonight. One small pause is allowed. A sip of water, a softer light, a little kindness for yourself.",
      ],
      [
        "surprise",
        "you want a little surprise",
        "There is a tiny garden here, a postcard you can make, and seven hidden hearts in the story. Pick whichever makes you curious.",
      ],
      [
        "sweet",
        "you want something sweet",
        "Some things are lovely simply because someone took the time to make them. May this little place bring a softer moment to your day.",
      ],
    ];
    const rows = templates.map(([id, when, body], i) => ({
      id: `demo-letter-${id}`,
      kind: "letters",
      title: `Open when ${when}`,
      body,
      description: "Editable sample letter — replace with your own words.",
      ownerId,
      audience: "public",
      enabled: true,
      demo: true,
      displayOrder: i,
      color: i % 2 ? "peach" : "cream",
    }));
    const notes = [
      "Just a reminder that you deserve all the happiness coming your way.",
      "A little pause. A little sunshine. A little kindness for yourself.",
      "There is room for something lovely in an ordinary day.",
      "A small reminder: you are allowed to take your time.",
      "Keep one beautiful little thing from today.",
      "A fresh page doesn't have to be a perfect page.",
      "Let a tiny daisy be your excuse to smile today.",
    ];
    rows.push(
      ...notes.map((body, i) => ({
        id: `demo-daily-${i}`,
        kind: "today",
        title: `A little note ${i + 1}`,
        body,
        description: "Curated sample message.",
        ownerId,
        audience: "public",
        enabled: true,
        demo: true,
        displayOrder: i,
        color: "cream",
      })),
    );
    await db.$transaction(
      rows.map((data) =>
        db.worldContent.upsert({
          where: { id: data.id },
          create: data,
          update: {},
        }),
      ),
    );
    for (const [mood, body] of Object.entries({
      happy: "Here's a little extra happiness for your day.",
      tired: "I hope you get a little time to relax today. You deserve it.",
      missing: "Here is a small, quiet place to keep you company.",
      smile: "A tiny cloud and a bouquet might bring a little smile.",
      proud: "Take a moment to enjoy your own little victory.",
      browsing: "Follow whichever little surprise catches your eye.",
    }))
      await db.worldContent.upsert({
        where: { id: `demo-mood-${mood}` },
        create: {
          id: `demo-mood-${mood}`,
          kind: "mood",
          title: mood,
          body,
          description: "Curated sample response.",
          ownerId,
          audience: "public",
          enabled: true,
          demo: true,
          metadata: JSON.stringify({
            mood,
            letterId: mood === "tired" ? "demo-letter-difficult" : null,
            activity: mood === "smile" ? "games" : "garden",
          }),
        },
        update: {},
      });
    for (const [id, title, unlockAt, body] of [
      [
        "future",
        "A little package for a future day",
        "2099-01-01T00:00:00Z",
        "An editable sample surprise, safely kept on the server until its release.",
      ],
      [
        "open",
        "A package you can open today",
        "2020-01-01T00:00:00Z",
        "A little sample package, opened at just the right moment. Replace this with your own letter, photographs, or recording.",
      ],
    ])
      await db.worldContent.upsert({
        where: { id: `demo-capsule-${id}` },
        create: {
          id: `demo-capsule-${id}`,
          kind: "capsules",
          title,
          body,
          description: "Sample time capsule — not a real relationship date.",
          ownerId,
          audience: "public",
          enabled: true,
          demo: true,
          capsule: {
            create: { unlockAt: new Date(unlockAt), timeZone: "Asia/Kolkata" },
          },
        },
        update: {},
      });
    await db.worldContent.upsert({
      where: { id: "demo-date-spring" },
      create: {
        id: "demo-date-spring",
        kind: "dates",
        title: "A little spring celebration",
        body: "A sample calendar entry. Set your actual meaningful dates in the studio.",
        description: "Sample date, not a personal milestone.",
        date: "2026-03-21",
        recurring: true,
        ownerId,
        audience: "public",
        enabled: true,
        demo: true,
      },
      update: {},
    });
    await db.gardenFlower.upsert({
      where: { eventKey: "milestone:demo-date-spring" },
      create: {
        eventKey: "milestone:demo-date-spring",
        label: "Sample spring milestone",
        type: "daisy",
        color: "#e8a8ad",
        x: 50,
        y: 45,
        contentId: "demo-date-spring",
        ownerId,
      },
      update: {},
    });
    for (const [i, title, latitude, longitude, memoryId] of [
      [1, "Sample stop · Delhi", 28.61, 77.21, "demo-1"],
      [2, "Sample stop · Mumbai", 19.08, 72.88, "demo-2"],
      [3, "Sample stop · Goa", 15.49, 73.83, "demo-3"],
    ] as const)
      await db.memoryLocation.upsert({
        where: { id: `demo-place-${i}` },
        create: {
          id: `demo-place-${i}`,
          title,
          description:
            "Illustrative map pin and sample photograph. This is not a claimed visit.",
          latitude,
          longitude,
          precision: "city",
          audience: "public",
          ownerId,
          enabled: true,
          demo: true,
          memories: { create: { memoryId } },
        },
        update: {},
      });
    // Original generated chime: real playable audio, explicitly not the owner's voice.
    const samples = 44100 * 2,
      buffer = Buffer.alloc(44 + samples * 2);
    buffer.write("RIFF", 0);
    buffer.writeUInt32LE(buffer.length - 8, 4);
    buffer.write("WAVEfmt ", 8);
    buffer.writeUInt32LE(16, 16);
    buffer.writeUInt16LE(1, 20);
    buffer.writeUInt16LE(1, 22);
    buffer.writeUInt32LE(44100, 24);
    buffer.writeUInt32LE(88200, 28);
    buffer.writeUInt16LE(2, 32);
    buffer.writeUInt16LE(16, 34);
    buffer.write("data", 36);
    buffer.writeUInt32LE(samples * 2, 40);
    for (let i = 0; i < samples; i++)
      buffer.writeInt16LE(
        Math.round(
          Math.sin((2 * Math.PI * 523.25 * i) / 44100) *
            Math.exp(-i / 20000) *
            2200,
        ),
        44 + i * 2,
      );
    const mediaDirectory = path.join(
      process.cwd(),
      ".data",
      process.env.NEXT_TEST_BUILD === "1" ? "world-media-test" : "world-media",
    );
    await mkdir(mediaDirectory, {
      recursive: true,
    });
    await writeFile(path.join(mediaDirectory, "demo-chime.wav"), buffer);
    await db.mediaAsset.upsert({
      where: { id: "demo-chime" },
      create: {
        id: "demo-chime",
        storageKey: "demo-chime.wav",
        mime: "audio/wav",
        bytes: buffer.length,
        title: "Original sample chime",
        ownerId,
        audience: "public",
        approved: true,
      },
      update: {},
    });
    for (const kind of ["voice", "music"])
      await db.worldContent.upsert({
        where: { id: `demo-${kind}-chime` },
        create: {
          id: `demo-${kind}-chime`,
          kind,
          title:
            kind === "voice"
              ? "A sample sound inside a photograph"
              : "A quiet little chime",
          body: "An original two-second chime to try the player. Add your own voice or licensed song in the studio.",
          description:
            "Generated sample audio — not a personal voice recording.",
          ownerId,
          audience: "public",
          enabled: true,
          demo: true,
          metadata: JSON.stringify({
            artist: "Original website sample",
            transcript:
              "A gentle generated chime. No spoken words or personal recording.",
          }),
          attachments: { create: { assetId: "demo-chime" } },
          memories: { create: { memoryId: "demo-1" } },
        },
        update: {},
      });
    await db.$transaction([
      ...features.map((feature) =>
        db.featureSettings.upsert({
          where: { key: feature.id },
          create: { key: feature.id, enabled: true },
          update: {},
        }),
      ),
      db.featureSettings.upsert({
        where: { key: "world" },
        create: {
          key: "world",
          configuration: JSON.stringify(defaultWorldSettings),
        },
        update: {},
      }),
    ]);
  })().catch((error) => {
    pending = undefined;
    throw error;
  }));
}
