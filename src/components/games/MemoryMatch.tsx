"use client";
import { useEffect, useRef, useState } from "react";
import { Heart, Flower } from "@phosphor-icons/react";
import { matchDeck } from "@/lib/games/engines";
import type { MemoryMedia } from "@/types/memory";
import { usePlayground } from "./GameProgress";
import GameCompletion from "./GameCompletion";
export default function MemoryMatch({ memories }: { memories: MemoryMedia[] }) {
  const { config, finish } = usePlayground();
  const [deck] = useState(() => matchDeck(memories));
  const [flipped, setFlipped] = useState<number[]>([]),
    [matched, setMatched] = useState<string[]>([]),
    [turns, setTurns] = useState(0);
  const pending = useRef<number[]>([]);
  const locked = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const completed = useRef(false);
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );
  function flip(index: number) {
    if (
      locked.current ||
      pending.current.includes(index) ||
      matched.includes(deck[index].pair)
    )
      return;
    const next = [...pending.current, index];
    pending.current = next;
    setFlipped(next);
    if (next.length !== 2) return;
    locked.current = true;
    const nextTurns = turns + 1;
    setTurns(nextTurns);
    if (deck[next[0]].pair === deck[next[1]].pair) {
      const pairs = [...matched, deck[index].pair];
      setMatched(pairs);
      pending.current = [];
      setFlipped([]);
      locked.current = false;
      if (pairs.length === deck.length / 2 && !completed.current) {
        completed.current = true;
        const key = deck
          .map((c) => c.pair)
          .filter((v, i, a) => a.indexOf(v) === i)
          .sort()
          .join("|");
        finish("match", (p) => ({
          ...p,
          matchedPairsBest: {
            ...p.matchedPairsBest,
            [key]: Math.min(p.matchedPairsBest[key] || Infinity, nextTurns),
          },
        }));
      }
    } else {
      timer.current = setTimeout(() => {
        pending.current = [];
        setFlipped([]);
        locked.current = false;
      }, 1100);
    }
  }
  if (!deck.length)
    return (
      <p className="game-empty">
        Approve a photograph to make your first matching pair.
      </p>
    );
  if (matched.length === deck.length / 2)
    return (
      <GameCompletion message={config.messages.match}>
        <p>
          {turns} turns · {matched.length} pairs
        </p>
        <p className="handwritten">{config.messages.matchNote}</p>
      </GameCompletion>
    );
  return (
    <div>
      <p role="status" className="game-kicker">
        {turns} turns · {matched.length} of {deck.length / 2} pairs found
      </p>
      {deck[0].media.demo && (
        <p className="game-disclosure">Playing with sample photographs.</p>
      )}
      <div className="match-grid">
        {deck.map((card, i) => {
          const revealed = flipped.includes(i) || matched.includes(card.pair);
          return (
            <button
              key={card.id}
              className={`match-card ${revealed ? "flipped" : ""} ${matched.includes(card.pair) ? "matched" : ""}`}
              aria-label={
                matched.includes(card.pair)
                  ? `Matched ${card.media.title}`
                  : revealed
                    ? `Revealed ${card.media.title}`
                    : `Turn over card ${i + 1}`
              }
              aria-pressed={revealed}
              disabled={matched.includes(card.pair)}
              onClick={() => flip(i)}
            >
              <span className="match-inner">
                <span className="match-back">
                  <Heart size={29} weight="light" />
                  <span className="handwritten">a little moment</span>
                </span>
                <span className="match-front">
                  <img src={card.media.mediaUrl} alt="" />
                  <span className="handwritten">
                    {card.media.caption || card.media.title}
                  </span>
                  {matched.includes(card.pair) && (
                    <Flower className="matched-flower" size={22} />
                  )}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
