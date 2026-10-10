"use client";
import { useRef, useState } from "react";
import type { MemoryMedia } from "@/types/memory";
import { usePlayground } from "./GameProgress";
export default function GuessTheMemory({
  memories,
}: {
  memories: MemoryMedia[];
}) {
  const { config, puzzleId, finish } = usePlayground();
  const puzzles = config.puzzles;
  const [index, setIndex] = useState(
    Math.max(
      0,
      puzzles.findIndex((p) => p.id === puzzleId),
    ),
  );
  const [clue, setClue] = useState(0),
    [revealed, setRevealed] = useState(false),
    [feedback, setFeedback] = useState("");
  const lock = useRef(false);
  const puzzle = puzzles[index];
  const photo = memories.find((m) => m.id === puzzle?.approvedMediaId);
  function reveal() {
    if (lock.current || !puzzle) return;
    lock.current = true;
    setRevealed(true);
    setFeedback("");
    finish("guess", (p) => ({
      ...p,
      discoveredMemoryIds: [
        ...new Set([...p.discoveredMemoryIds, puzzle.approvedMediaId]),
      ].slice(-100),
    }));
  }
  if (!puzzle || !photo)
    return (
      <p className="game-empty">
        Your real memories deserve your own clues. Add a puzzle linked to an
        approved photo in the studio; no personal details are guessed for you.
      </p>
    );
  return (
    <div className="guess-game">
      <p className="game-kicker">
        Memory {index + 1} of {puzzles.length}
      </p>
      <div className={`guess-polaroid ${revealed ? "revealed" : ""}`}>
        <div className="guess-image">
          <img
            src={photo.mediaUrl}
            alt={revealed ? photo.title : "A photograph waiting to be revealed"}
            style={{
              filter: `blur(${revealed ? 0 : Math.max(2, 14 - clue * 4)}px)`,
            }}
          />
        </div>
        <span className="handwritten">
          {revealed ? photo.caption || photo.title : "a little moment, waiting"}
        </span>
      </div>
      {photo.demo && (
        <p className="game-disclosure">Sample photograph · sample clues</p>
      )}
      <h3>{revealed ? photo.title : puzzle.question}</h3>
      {revealed ? (
        <>
          <p className="handwritten guess-note">{puzzle.revealMessage}</p>
          <p>{config.messages.guessReward}</p>
          <button
            className="button primary"
            onClick={() => {
              setIndex((index + 1) % puzzles.length);
              setClue(0);
              setRevealed(false);
              setFeedback("");
              lock.current = false;
            }}
          >
            {puzzles.length > 1
              ? "Another little memory"
              : "Play this memory again"}
          </button>
        </>
      ) : (
        <>
          <p className="memory-clue" role="status">
            Clue {clue + 1}: {puzzle.clues[clue]}
          </p>
          <div className="answer-list">
            {puzzle.possibleAnswers.map((o) => (
              <button
                className="game-answer"
                key={o.id}
                onClick={() =>
                  o.id === puzzle.correctAnswerId
                    ? reveal()
                    : setFeedback(
                        "Not quite. Try another clue, or take a little peek.",
                      )
                }
              >
                {o.label}
              </button>
            ))}
          </div>
          <p role="status">{feedback}</p>
          <div className="game-actions">
            <button
              className="button secondary"
              disabled={clue === puzzle.clues.length - 1}
              onClick={() =>
                setClue((c) => Math.min(c + 1, puzzle.clues.length - 1))
              }
            >
              One more clue
            </button>
            <button className="text-button" onClick={reveal}>
              Reveal the answer
            </button>
          </div>
        </>
      )}
    </div>
  );
}
