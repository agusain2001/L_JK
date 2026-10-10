import { z } from "zod";

export const gameIds = [
  "quiz",
  "match",
  "hearts",
  "bouquet",
  "guess",
  "adventure",
] as const;
export const chapters = [
  "home",
  "story",
  "memories",
  "little-things",
  "timeline",
  "garden",
  "letter",
  "gallery",
  "ending",
] as const;
const id = z.string().regex(/^[a-zA-Z0-9_-]{1,80}$/);
const text = z.string().trim().min(1).max(500);
const option = z.object({ id, label: text });
const answers = z
  .array(option)
  .min(2)
  .max(4)
  .refine(
    (v) => new Set(v.map((x) => x.id)).size === v.length,
    "Answer IDs must be unique.",
  );
const feedback = z.object({ correct: text, incorrect: text, opinion: text });
export const quizSchema = z
  .object({
    id,
    question: text,
    options: answers,
    correctAnswerId: id.optional(),
    feedback,
    imageId: id.optional(),
  })
  .refine(
    (v) =>
      !v.correctAnswerId || v.options.some((o) => o.id === v.correctAnswerId),
    "Choose a correct answer from the options.",
  );
export const puzzleSchema = z
  .object({
    id,
    approvedMediaId: id,
    question: text,
    clues: z.array(text).min(1).max(6),
    possibleAnswers: answers,
    correctAnswerId: id,
    revealMessage: text,
  })
  .refine(
    (v) => v.possibleAnswers.some((o) => o.id === v.correctAnswerId),
    "Puzzle answer must exist.",
  );
export const flowerSchema = z.object({
  id: z.enum(["daisy", "tulip", "rose", "wildflower"]),
  label: text,
  availableColors: z
    .array(z.string().regex(/^#[0-9a-fA-F]{6}$/))
    .min(1)
    .max(6),
  optionalMeaning: z.string().max(200).optional(),
});
export const gameConfigSchema = z
  .object({
    version: z.literal(1),
    games: z
      .array(
        z.object({
          id: z.enum(gameIds),
          title: text,
          description: text,
          enabled: z.boolean(),
          displayOrder: z.number().int().min(0).max(100),
          themeVariant: z.enum(["peach", "cream", "sage"]),
        }),
      )
      .length(6),
    quizQuestions: z.array(quizSchema).max(30),
    puzzles: z.array(puzzleSchema).max(30),
    hearts: z
      .array(
        z.object({
          id,
          chapterId: z.enum(chapters),
          position: z.object({
            x: z.number().min(5).max(95),
            y: z.number().min(5).max(95),
          }),
          message: text,
          enabled: z.boolean(),
        }),
      )
      .length(7),
    flowers: z.array(flowerSchema).min(1).max(4),
    adventureQuestions: z
      .array(z.object({ id, question: text, optionA: option, optionB: option }))
      .min(1)
      .max(12),
    messages: z.object({
      quiz: text,
      quizNote: text.default(
        "A little note unlocked: being here together is the sweetest part.",
      ),
      match: text,
      matchNote: text.default(
        "A note to keep: some lovely things find their way back to each other.",
      ),
      heartReward: text,
      bouquet: text,
      guessReward: text,
    }),
  })
  .superRefine((v, ctx) => {
    for (const field of [
      "games",
      "quizQuestions",
      "puzzles",
      "hearts",
      "flowers",
      "adventureQuestions",
    ] as const) {
      if (new Set(v[field].map((x) => x.id)).size !== v[field].length)
        ctx.addIssue({
          code: "custom",
          path: [field],
          message: "IDs must be unique.",
        });
    }
    for (const q of v.adventureQuestions)
      if (q.optionA.id === q.optionB.id)
        ctx.addIssue({
          code: "custom",
          path: ["adventureQuestions"],
          message: "Adventure choices need different IDs.",
        });
  });
export const bouquetSchema = z.object({
  flowers: z
    .array(
      z.object({
        id,
        type: flowerSchema.shape.id,
        color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
      }),
    )
    .max(7),
  wrap: z.enum(["cream", "peach", "sage"]),
  ribbon: z.enum(["rose", "sage", "blue"]),
  note: z.string().max(180),
  arrangement: z.enum(["fan", "gathered", "cascade"]),
});
export const progressSchema = z.object({
  version: z.literal(1),
  completedGameIds: z.array(z.enum(gameIds)).max(6),
  quizResults: z
    .array(
      z
        .object({
          score: z.number().int().min(0),
          total: z.number().int().min(0),
        })
        .refine((x) => x.score <= x.total),
    )
    .max(20),
  matchedPairsBest: z.record(z.string(), z.number().int().positive()),
  collectedHeartIds: z.array(id).max(7),
  discoveredMemoryIds: z.array(id).max(100),
  bouquets: z.array(bouquetSchema).max(5),
  adventureChoices: z.record(z.string(), z.string().max(80)),
});
export type GameId = (typeof gameIds)[number];
export type GameConfig = z.infer<typeof gameConfigSchema>;
export type QuizQuestion = z.infer<typeof quizSchema>;
export type MemoryPuzzle = z.infer<typeof puzzleSchema>;
export type Bouquet = z.infer<typeof bouquetSchema>;
export type GameProgress = z.infer<typeof progressSchema>;
export const emptyProgress = (): GameProgress => ({
  version: 1,
  completedGameIds: [],
  quizResults: [],
  matchedPairsBest: {},
  collectedHeartIds: [],
  discoveredMemoryIds: [],
  bouquets: [],
  adventureChoices: {},
});
