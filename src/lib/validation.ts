import { z } from "zod";
export const mediaUrl = z
  .string()
  .max(2048)
  .refine((value) => {
    if (/^\/uploads\/[a-f0-9-]+\.(jpg|png|webp|mp4|webm)$/.test(value))
      return true;
    try {
      const url = new URL(value);
      return (
        url.protocol === "https:" &&
        !url.username &&
        !url.password &&
        !/^(localhost|127\.|10\.|192\.168\.|169\.254\.|\[|0\.)/i.test(
          url.hostname,
        )
      );
    } catch {
      return false;
    }
  }, "Use a public HTTPS media URL or an uploaded file.");
export const memoryInput = z
  .object({
    kind: z.enum(["image", "video"]).default("image"),
    title: z.string().max(120).default(""),
    caption: z.string().max(200).default(""),
    description: z.string().max(2000).default(""),
    mediaUrl,
    thumbnailUrl: mediaUrl.optional(),
    sourceUrl: z.url().optional(),
    date: z.string().max(40).optional(),
    location: z.string().max(120).optional(),
    tags: z.array(z.string().max(40)).max(12).default([]),
    featured: z.boolean().default(false),
    approved: z.boolean().default(false),
    audience: z.enum(["public", "private"]).default("public"),
    recipientId: z.string().max(100).nullable().optional(),
    order: z.number().int().min(0).max(10000).default(0),
    chapter: z
      .enum(["hero", "memories", "timeline", "gallery"])
      .default("memories"),
  })
  .refine((m) => m.kind !== "video" || !!m.thumbnailUrl, {
    message: "Video memories need a poster image.",
    path: ["thumbnailUrl"],
  }).refine(m => m.audience !== "private" || m.mediaUrl.startsWith("/uploads/"), {message:"Private photographs must use an authorized uploaded file.",path:["audience"]});

// Actor-specific adapters should transform their records into this canonical format.
export function normalizeImport(items: unknown[]) {
  const accepted: z.infer<typeof memoryInput>[] = [];
  let rejected = 0;
  const seen = new Set<string>();
  for (const item of items) {
    const parsed = memoryInput.safeParse(item);
    if (!parsed.success) {
      rejected++;
      continue;
    }
    if (seen.has(parsed.data.mediaUrl)) continue;
    seen.add(parsed.data.mediaUrl);
    accepted.push({ ...parsed.data, approved: false });
  }
  return { accepted, rejected };
}
