"use client";
import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import AnimatedHeading from "../AnimatedHeading";
import {
  Heart,
  Flower,
  Question,
  Images,
  Compass,
  EnvelopeSimple,
  ArrowRight,
  ArrowLeft,
  ArrowCounterClockwise,
} from "@phosphor-icons/react";
import type { MemoryMedia } from "@/types/memory";
import type { GameId } from "@/lib/games/schemas";
import { LittleSurprises, usePlayground } from "./GameProgress";
const loading = () => (
  <p role="status" className="game-empty">
    Chhota sa surprise khul raha hai...
  </p>
);
const Quiz = dynamic(() => import("./RelationshipQuiz"), { loading });
const Match = dynamic(() => import("./MemoryMatch"), { loading });
const Hearts = dynamic(() => import("./HiddenHeartHunt"), { loading });
const Bouquet = dynamic(() => import("./BouquetBuilder"), { loading });
const Guess = dynamic(() => import("./GuessTheMemory"), { loading });
const Adventure = dynamic(() => import("./NextAdventure"), { loading });
const icons = {
  quiz: Question,
  match: Images,
  hearts: Heart,
  bouquet: Flower,
  guess: EnvelopeSimple,
  adventure: Compass,
};
export default function GamesHub({ memories }: { memories: MemoryMedia[] }) {
  const { config, progress, ready, active, open, exit } = usePlayground();
  const [replay, setReplay] = useState(0);
  const heading = useRef<HTMLHeadingElement>(null);
  const reduced = useReducedMotion();
  useEffect(() => {
    if (!active) return;
    const frame = requestAnimationFrame(() =>
      heading.current?.focus({ preventScroll: true }),
    );
    return () => cancelAnimationFrame(frame);
  }, [active, replay]);
  const games = config.games
    .filter((g) => g.enabled)
    .sort((a, b) => a.displayOrder - b.displayOrder);
  const game = games.find((g) => g.id === active);
  function play(id: GameId) {
    setReplay(0);
    open(id);
  }
  return (
    <section id="games" className="playground chapter">
      <div className="section-heading">
        <span className="handwritten">ab ek game khelein? ♡</span>
        <AnimatedHeading>
          Dekhte hain,
          <br />
          <em>kaun jeetega.</em>
        </AnimatedHeading>
        <p>
          Bas timepass ke liye. Jeet gayi toh tareef bhi karunga.
        </p>
      </div>
      <AnimatePresence mode="wait" initial={false}>
        {!game ? (
          <motion.div
            key="menu"
            className="game-preview-grid"
            initial={false}
            animate={{ opacity: 1 }}
            exit={reduced ? undefined : { opacity: 0 }}
          >
            {games.map((g, i) => {
              const Icon = icons[g.id];
              return (
                <article
                  key={g.id}
                  className={`game-preview game-theme-${g.themeVariant}`}
                  style={
                    {
                      "--paper-angle": `${[-3, 2, -1, 2, -2, 3][i % 6]}deg`,
                    } as React.CSSProperties
                  }
                >
                  <div className="game-preview-art" aria-hidden="true">
                    {g.id === "match" ? (
                      <div className="preview-papers">
                        {memories
                          .filter((m) => m.kind === "image")
                          .slice(0, 2)
                          .map((m) => (
                            <img
                              key={m.id}
                              src={m.mediaUrl}
                              alt=""
                              loading="lazy"
                            />
                          ))}
                        <Icon size={36} weight="light" />
                      </div>
                    ) : (
                      <>
                        <Icon size={66} weight="light" />
                        <span className="preview-doodle">♡</span>
                      </>
                    )}
                  </div>
                  <span className="game-number">
                    chhota game {String(i + 1).padStart(2, "0")}
                  </span>
                  <AnimatedHeading as="h3">{g.title}</AnimatedHeading>
                  <p>{g.description}</p>
                  <div className="game-preview-bottom">
                    {progress.completedGameIds.includes(g.id) ? (
                      <span className="handwritten">
                        yeh surprise mil gaya ♡
                      </span>
                    ) : (
                      <span className="handwritten">
                        ek surprise bhi milega
                      </span>
                    )}
                    <button
                      className="text-button"
                      disabled={!ready}
                      aria-label={`Play ${g.title}`}
                      onClick={() => play(g.id)}
                    >
                      Play <ArrowRight size={17} />
                    </button>
                  </div>
                </article>
              );
            })}
            {!games.length && (
              <p className="game-empty">
                Abhi koi game nahi hai. Baaki sab dekh lo.
              </p>
            )}
          </motion.div>
        ) : (
          <motion.div
            key={`${game.id}-${replay}`}
            className="game-stage"
            data-lenis-prevent
            initial={reduced ? false : { opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduced ? undefined : { opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
          >
            <div className="game-stage-bar">
              <button className="text-button" onClick={exit}>
                <ArrowLeft size={18} />
                Exit to games menu
              </button>
              <button
                className="text-button"
                onClick={() => setReplay((n) => n + 1)}
              >
                <ArrowCounterClockwise size={18} />
                Restart game
              </button>
            </div>
            <h2 ref={heading} tabIndex={-1} className="game-stage-title">
              {game.title}
            </h2>
            {game.id === "quiz" && <Quiz memories={memories} />}{" "}
            {game.id === "match" && <Match memories={memories} />}{" "}
            {game.id === "hearts" && <Hearts />}{" "}
            {game.id === "bouquet" && <Bouquet />}{" "}
            {game.id === "guess" && <Guess memories={memories} />}{" "}
            {game.id === "adventure" && <Adventure />}
          </motion.div>
        )}
      </AnimatePresence>
      <LittleSurprises />
    </section>
  );
}
export function PlaygroundLink({
  game,
  puzzleId,
  children,
}: {
  game: GameId;
  puzzleId?: string;
  children: React.ReactNode;
}) {
  const { config, open } = usePlayground();
  if (!config.games.some((g) => g.id === game && g.enabled)) return null;
  return (
    <a
      href="#games"
      className="text-button playground-story-link"
      onClick={() => open(game, puzzleId)}
    >
      {children}
      <ArrowRight size={17} />
    </a>
  );
}
