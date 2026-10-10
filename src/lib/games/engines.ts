import type { GameConfig, QuizQuestion, GameProgress, GameId } from "./schemas";
import type { MemoryMedia } from "@/types/memory";
export function keepQuizBest(
  results: GameProgress["quizResults"],
  result: GameProgress["quizResults"][number],
) {
  return [...results, result]
    .sort(
      (a, b) =>
        (b.total ? b.score / b.total : -1) - (a.total ? a.score / a.total : -1),
    )
    .slice(0, 20);
}
export function quizScore(
  questions: QuizQuestion[],
  answers: Record<string, string>,
) {
  const facts = questions.filter((q) => q.correctAnswerId);
  return {
    score: facts.filter((q) => answers[q.id] === q.correctAnswerId).length,
    total: facts.length,
  };
}
export function shuffle<T>(
  items: readonly T[],
  random: () => number = Math.random,
): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}
export function availableConfig(
  config: GameConfig,
  media: MemoryMedia[],
): GameConfig {
  const ids = new Set(
    media
      .filter((m) => m.kind === "image" && (m.approved || m.demo))
      .map((m) => m.id),
  );
  return {
    ...config,
    quizQuestions: config.quizQuestions.filter(
      (q) => !q.imageId || ids.has(q.imageId),
    ),
    puzzles: config.puzzles.filter((p) => ids.has(p.approvedMediaId)),
  };
}
export function complete(progress: GameProgress, id: GameId): GameProgress {
  return {
    ...progress,
    completedGameIds: [...new Set([...progress.completedGameIds, id])],
  };
}
export function collectHeart(
  progress: GameProgress,
  id: string,
  config: GameConfig,
): GameProgress {
  const valid = config.hearts.filter((h) => h.enabled);
  if (!valid.some((h) => h.id === id)) return progress;
  const next = {
    ...progress,
    collectedHeartIds: [...new Set([...progress.collectedHeartIds, id])],
  };
  return valid.every((h) => next.collectedHeartIds.includes(h.id))
    ? complete(next, "hearts")
    : next;
}
export function matchDeck(media: MemoryMedia[]) {
  const photos = media
    .filter((m) => m.kind === "image" && (m.approved || m.demo))
    .slice(0, 6);
  return shuffle(
    photos.flatMap((m) => [
      { id: `${m.id}-a`, pair: m.id, media: m },
      { id: `${m.id}-b`, pair: m.id, media: m },
    ]),
  );
}
