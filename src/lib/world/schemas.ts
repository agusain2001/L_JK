import { z } from "zod";
export const featureIds = [
  "letters",
  "voice",
  "capsules",
  "today",
  "map",
  "photo-booth",
  "companion",
  "music",
  "bucket-list",
  "dates",
  "notes",
  "mood",
  "garden",
  "surprise",
  "keepsakes",
] as const;
export type FeatureId = (typeof featureIds)[number];
export const audienceSchema = z.enum(["public", "private"]);
const optionalId = z.string().max(100).nullable().optional();
export const daySchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((value) => {
    const date = new Date(`${value}T12:00:00Z`);
    return (
      Number.isFinite(date.getTime()) &&
      date.toISOString().slice(0, 10) === value
    );
  }, "Choose a real calendar date.");
export const zoneSchema = z
  .string()
  .max(80)
  .refine((value) => {
    try {
      new Intl.DateTimeFormat("en", { timeZone: value });
      return true;
    } catch {
      return false;
    }
  }, "Choose an IANA time zone.");
export const contentSchema = z
  .object({
    id: optionalId,
    kind: z.enum([
      "letters",
      "voice",
      "capsules",
      "today",
      "music",
      "dates",
      "mood",
      "rewards",
    ]),
    title: z.string().trim().min(1).max(140),
    body: z.string().max(12000).default(""),
    description: z.string().max(1000).default(""),
    audience: audienceSchema.default("private"),
    recipientId: optionalId,
    enabled: z.boolean().default(false),
    demo: z.boolean().default(false),
    color: z.enum(["cream", "peach", "sage", "blue"]).default("cream"),
    displayOrder: z.number().int().min(0).max(1000).default(0),
    date: daySchema.nullable().optional(),
    recurring: z.boolean().default(false),
    featured: z.boolean().default(false),
    memoryIds: z.array(z.string().max(100)).max(20).default([]),
    assetIds: z.array(z.string().max(100)).max(10).default([]),
    metadata: z
      .object({
        artist: z.string().max(140).optional(),
        link: z
          .string()
          .max(2048)
          .refine((value) => {
            try {
              const url = new URL(value);
              return (
                url.protocol === "https:" && !url.username && !url.password
              );
            } catch {
              return value === "";
            }
          }, "Use an HTTPS streaming link.")
          .optional(),
        mood: z
          .enum(["happy", "tired", "missing", "smile", "proud", "browsing"])
          .optional(),
        letterId: optionalId,
        activity: z.enum(["games", "garden", "photo-booth"]).optional(),
        capsuleId: optionalId,
        transcript: z.string().max(16000).optional(),
        gameId: z
          .enum(["hearts", "quiz", "match", "guess", "bouquet", "adventure"])
          .optional(),
      })
      .default({}),
    unlockAt: z.iso.datetime({ offset: true }).optional(),
    timeZone: zoneSchema.default("Asia/Kolkata"),
    status: z.enum(["scheduled", "revoked"]).default("scheduled"),
  })
  .superRefine((value, ctx) => {
    if (value.kind === "rewards" && !value.metadata.gameId)
      ctx.addIssue({
        code: "custom",
        path: ["metadata", "gameId"],
        message: "Choose which game unlocks this bonus.",
      });
    if (value.kind === "capsules" && !value.unlockAt)
      ctx.addIssue({
        code: "custom",
        path: ["unlockAt"],
        message: "Capsules need a release timestamp including its UTC offset.",
      });
  });
export const locationSchema = z
  .object({
    id: optionalId,
    title: z.string().trim().min(1).max(140),
    description: z.string().max(1000).default(""),
    latitude: z.number().min(-90).max(90).nullable(),
    longitude: z.number().min(-180).max(180).nullable(),
    precision: z.enum(["city", "approximate", "exact", "hidden"]),
    audience: audienceSchema,
    recipientId: optionalId,
    enabled: z.boolean(),
    demo: z.boolean().default(false),
    date: daySchema.nullable().optional(),
    memoryIds: z.array(z.string().max(100)).max(20).default([]),
  })
  .refine(
    (v) => (v.latitude === null) === (v.longitude === null),
    "Supply both coordinates or neither.",
  );
export const bucketSchema = z.object({
  id: optionalId,
  title: z.string().trim().min(1).max(140),
  description: z.string().max(1000).default(""),
  category: z.string().trim().min(1).max(60).default("Little adventures"),
  completed: z.boolean().default(false),
  order: z.number().int().min(0).max(1000).default(0),
  targetDate: daySchema.nullable().optional(),
  memoryId: optionalId,
});
export const messageSchema = z.object({
  submissionKey: z.uuid().optional(),
  body: z.string().trim().min(1).max(2000),
  recipientId: z.string().min(1).max(100),
  sticker: z.enum(["heart", "flower", "star"]).nullable().optional(),
  memoryId: optionalId,
  replyToId: optionalId,
});
export const flowerSchema = z
  .object({
    id: optionalId,
    eventKey: z.string().min(1).max(150),
    label: z.string().trim().min(1).max(140),
    type: z.enum(["daisy", "tulip", "rose", "wildflower"]),
    color: z.string().regex(/^#[a-fA-F0-9]{6}$/),
    x: z.number().min(5).max(95),
    y: z.number().min(10).max(85),
    memoryId: optionalId,
    contentId: optionalId,
    bucketId: optionalId,
    enabled: z.boolean().default(true),
  })
  .refine(
    (v) => !!(v.memoryId || v.contentId || v.bucketId),
    "A flower must represent a memory, milestone, or completed activity.",
  );
export const settingsSchema = z.object({
  timeZone: zoneSchema,
  guestAccess: z.boolean(),
  sharedBucket: z.boolean(),
  noteRetentionDays: z.number().int().min(1).max(3650),
  boothSharing: z.boolean(),
  companionHints: z.array(z.string().min(1).max(240)).min(1).max(15),
  surpriseFilter: z.enum([
    "all",
    "featured",
    "captions",
    "videos",
    "surprise-only",
  ]),
  surpriseIds: z.array(z.string().max(100)).max(100),
  excludedIds: z.array(z.string().max(100)).max(100),
  stickers: z.array(z.enum(["heart", "flower", "star"])).max(3),
});
export type ContentInput = z.infer<typeof contentSchema>;
export type WorldSettings = z.infer<typeof settingsSchema>;
export type WorldActor = {
  id: string;
  name: string;
  role: "owner" | "recipient";
} | null;
export type WorldContent = {
  id: string;
  kind: string;
  title: string;
  body?: string;
  description: string;
  audience: string;
  enabled: boolean;
  demo: boolean;
  color: string;
  displayOrder: number;
  date: string | null;
  recurring: boolean;
  featured: boolean;
  metadata: ContentInput["metadata"];
  memoryIds: string[];
  assets: { id: string; title: string; mime: string; url: string }[];
  unlockAt?: string;
  timeZone?: string;
  status?: string;
  locked?: boolean;
  openedAt?: string | null;
};
