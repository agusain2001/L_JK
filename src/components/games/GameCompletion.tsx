"use client";
import { Heart } from "@phosphor-icons/react";
import { usePlayground } from "./GameProgress";
export default function GameCompletion({
  message,
  children,
  onReplay,
}: {
  message: string;
  children?: React.ReactNode;
  onReplay?: () => void;
}) {
  const { exit } = usePlayground();
  return (
    <div className="game-completion">
      <Heart size={35} weight="light" aria-hidden="true" />
      <span className="handwritten">a little surprise, just for you</span>
      <h3>{message}</h3>
      {children}
      <div className="game-actions">
        {onReplay && (
          <button className="button secondary" onClick={onReplay}>
            Play again
          </button>
        )}
        <button className="button primary" onClick={exit}>
          Return to little games
        </button>
      </div>
    </div>
  );
}
