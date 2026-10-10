"use client";
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  emptyProgress,
  progressSchema,
  type GameProgress,
  type GameConfig,
  type GameId,
} from "@/lib/games/schemas";
import { complete, collectHeart } from "@/lib/games/engines";
import { gameStorageKey } from "@/lib/games/storage";
type Playground = {
  config: GameConfig;
  progress: GameProgress;
  ready: boolean;
  notice: string;
  active: GameId | null;
  puzzleId: string | null;
  open: (id: GameId, puzzle?: string) => void;
  exit: () => void;
  commit: (fn: (p: GameProgress) => GameProgress) => boolean;
  finish: (id: GameId, fn?: (p: GameProgress) => GameProgress) => void;
  find: (id: string) => void;
  reset: () => void;
  dialog: (open: boolean) => void;
};
const Context = createContext<Playground | null>(null);
export function PlaygroundProvider({
  config,
  children,
  onDialogChange,
  saveRewards = false,
  userId,
}: {
  config: GameConfig;
  children: ReactNode;
  onDialogChange: (open: boolean) => void;
  saveRewards?: boolean;
  userId?: string;
}) {
  const [progress, setProgress] = useState<GameProgress>(emptyProgress);
  const current = useRef(progress);
  const [ready, setReady] = useState(false);
  const [notice, setNotice] = useState("");
  const [active, setActive] = useState<GameId | null>(null);
  const [puzzleId, setPuzzleId] = useState<string | null>(null);
  const syncQueue = useRef(Promise.resolve());
  const storageKey = gameStorageKey(userId);
  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        const raw = localStorage.getItem(storageKey);
        if (!raw && userId && saveRewards) {
          const response = await fetch("/api/world/keepsakes", {
            cache: "no-store",
          });
          if (response.ok) {
            const saved = await response.json();
            const parsed = progressSchema.safeParse(saved.progress);
            if (parsed.success && !cancelled) {
              current.current = parsed.data;
              setProgress(parsed.data);
              localStorage.setItem(storageKey, JSON.stringify(parsed.data));
            }
          }
        }
        if (raw) {
          const parsed = progressSchema.safeParse(JSON.parse(raw));
          if (parsed.success) {
            parsed.data.collectedHeartIds = [
              ...new Set(parsed.data.collectedHeartIds),
            ].filter((id) => config.hearts.some((h) => h.id === id));
            current.current = parsed.data;
            setProgress(parsed.data);
          } else
            setNotice(
              "Older or unreadable progress was skipped. You can start fresh.",
            );
        }
      } catch {
        setNotice(
          "Browser storage is unavailable. You can still play for this visit.",
        );
      }
      if (!cancelled) setReady(true);
    }, 0);
    const sync = (e: StorageEvent) => {
      if (e.key !== storageKey) return;
      try {
        const parsed = progressSchema.safeParse(
          e.newValue ? JSON.parse(e.newValue) : emptyProgress(),
        );
        if (parsed.success) {
          parsed.data.collectedHeartIds = [
            ...new Set(parsed.data.collectedHeartIds),
          ].filter((id) => config.hearts.some((h) => h.id === id));
          current.current = parsed.data;
          setProgress(parsed.data);
        }
      } catch {
        /* Invalid external storage is never applied. */
      }
    };
    window.addEventListener("storage", sync);
    return () => {
      cancelled = true;
      clearTimeout(timer);
      window.removeEventListener("storage", sync);
    };
  }, [config.hearts, storageKey, userId, saveRewards]);
  function commit(fn: (p: GameProgress) => GameProgress) {
    if (!ready) return false;
    const next = progressSchema.parse(fn(current.current));
    current.current = next;
    setProgress(next);
    if (saveRewards) {
      syncQueue.current = syncQueue.current.then(async () => {
        try {
          const response = await fetch("/api/world/keepsakes", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "progress", progress: next }),
          });
          if (!response.ok) throw new Error();
          if (next.completedGameIds.length) {
            setNotice(
              "Your completed surprises are saved in your private keepsake drawer.",
            );
            window.dispatchEvent(new CustomEvent("for-you:reward"));
          }
        } catch {
          setNotice(
            "Your game is kept in this browser. The private drawer could not be updated; try saving again from the drawer.",
          );
        }
      });
    }
    try {
      localStorage.setItem(storageKey, JSON.stringify(next));
      return true;
    } catch {
      setNotice(
        "This surprise is kept for this visit. Your browser could not save progress.",
      );
      return false;
    }
  }
  return (
    <Context.Provider
      value={{
        config,
        progress,
        ready,
        notice,
        active,
        puzzleId,
        open: (id, puzzle) => {
          if (!config.games.some((g) => g.id === id && g.enabled)) return;
          setPuzzleId(puzzle || null);
          setActive(id);
        },
        exit: () => setActive(null),
        commit,
        finish: (id, fn) => commit((p) => complete(fn ? fn(p) : p, id)),
        find: (id) => commit((p) => collectHeart(p, id, config)),
        reset: () => {
          commit(() => emptyProgress());
          setActive(null);
          setNotice("A fresh little sky. Your progress has been reset.");
        },
        dialog: onDialogChange,
      }}
    >
      {children}
    </Context.Provider>
  );
}
export function usePlayground() {
  const ctx = useContext(Context);
  if (!ctx) throw new Error("Playground provider is missing.");
  return ctx;
}
export function LittleSurprises() {
  const { config, progress, ready, notice, reset } = usePlayground();
  const [confirm, setConfirm] = useState(false);
  const hearts = config.hearts.filter((h) => h.enabled);
  const found = hearts.filter((h) =>
    progress.collectedHeartIds.includes(h.id),
  ).length;
  const best = progress.quizResults
    .filter((r) => r.total > 0)
    .sort((a, b) => b.score / b.total - a.score / a.total)[0];
  return (
    <details className="little-surprises">
      <summary>
        Little Surprises ♡{" "}
        <span>{progress.completedGameIds.length} little games completed</span>
      </summary>
      <div className="surprise-record">
        <p>
          {found} of {hearts.length} little hearts found ♡
        </p>
        <p>
          {best
            ? `Highest quiz score: ${best.score} of ${best.total} facts`
            : "A little space for your first quiz."}
        </p>
        <p>
          {Object.values(progress.matchedPairsBest).length
            ? `Best matching turns: ${Math.min(...Object.values(progress.matchedPairsBest))}`
            : "Your matching memories will live here."}
        </p>
        <p>
          {progress.discoveredMemoryIds.length} memory notes revealed ·{" "}
          {progress.bouquets.length} bouquets kept in this browser
        </p>
        <p>
          Your progress stays on this browser. Nothing is booked, purchased, or
          shared.
        </p>
        {progress.bouquets.length > 0 && (
          <p>Open the bouquet game to restore your last kept bouquet.</p>
        )}
        {notice && <p role="status">{notice}</p>}
        {!confirm ? (
          <button
            className="text-button"
            disabled={!ready}
            onClick={() => setConfirm(true)}
          >
            Reset my progress
          </button>
        ) : (
          <div className="game-actions">
            <span>Clear all local game progress?</span>
            <button
              className="button secondary"
              onClick={() => setConfirm(false)}
            >
              Keep it
            </button>
            <button
              className="button primary"
              onClick={() => {
                reset();
                setConfirm(false);
              }}
            >
              Yes, reset progress
            </button>
          </div>
        )}
      </div>
    </details>
  );
}
