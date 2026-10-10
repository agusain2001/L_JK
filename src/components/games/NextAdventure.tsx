"use client";
import { useRef, useState } from "react";
import type { Icon } from "@phosphor-icons/react";
import {
  Sun,
  Moon,
  Mountains,
  Waves,
  Coffee,
  IceCream,
  Car,
  FilmSlate,
  Flower,
  Gift,
  Basket,
  ForkKnife,
} from "@phosphor-icons/react";
import { adventurePostcard, downloadPostcard } from "@/lib/games/postcards";
import { usePlayground } from "./GameProgress";
const art: Record<string, Icon> = {
  sunrise: Sun,
  sunset: Moon,
  mountains: Mountains,
  beach: Waves,
  coffee: Coffee,
  "ice-cream": IceCream,
  drive: Car,
  movie: FilmSlate,
  flowers: Flower,
  chocolates: Gift,
  picnic: Basket,
  dinner: ForkKnife,
};
export default function NextAdventure() {
  const { config, progress, finish, commit } = usePlayground();
  const questions = config.adventureQuestions;
  const [choices, setChoices] = useState<Record<string, string>>({}),
    [index, setIndex] = useState(0),
    [done, setDone] = useState(false),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const advancing = useRef(false);
  const question = questions[index];
  const selected = choices[question.id];
  const labels = questions.map(
    (q) =>
      [q.optionA, q.optionB].find((o) => o.id === choices[q.id])?.label || "",
  );
  const sentence = `Our next little adventure: ${labels
    .slice(0, 3)
    .map((x) => x.toLowerCase())
    .join(", ")}${
    labels.length > 3
      ? `, and ${labels
          .slice(3)
          .map((x) => x.toLowerCase())
          .join(", ")}`
      : ""
  }.`;
  async function download() {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    try {
      await downloadPostcard(
        adventurePostcard(sentence, labels),
        "our-next-little-adventure.png",
        1200,
      );
      setMessage("Your PNG is ready. The postcard download has started.");
    } catch (e) {
      setMessage((e as Error).message);
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  if (done)
    return (
      <div className="adventure-result">
        <div
          className="adventure-postcard"
          role="img"
          aria-label={sentence}
          dangerouslySetInnerHTML={{
            __html: adventurePostcard(sentence, labels),
          }}
        />
        <h3>{sentence}</h3>
        <p className="handwritten">a little day to dream about, together</p>
        <div className="game-actions">
          <button
            className="button primary"
            disabled={busy}
            onClick={() => void download()}
          >
            Download postcard
          </button>
          <button
            className="button secondary"
            onClick={() => {
              setDone(false);
              setIndex(0);
            }}
          >
            Adjust my choices
          </button>
          <button
            className="text-button"
            onClick={() => {
              setChoices({});
              setIndex(0);
              setDone(false);
              setMessage("");
            }}
          >
            Start again
          </button>
          <button
            className="text-button"
            onClick={() => {
              const saved = commit((p) => ({
                ...p,
                adventureChoices: choices,
              }));
              setMessage(
                saved
                  ? "Your adventure choices are remembered in this browser."
                  : "Your choices could not be stored. You can still download the postcard.",
              );
            }}
          >
            Remember my choices
          </button>
        </div>
        <p role="status">{message}</p>
      </div>
    );
  return (
    <div className="adventure-game">
      <p className="game-kicker">
        Little choice {index + 1} of {questions.length}
      </p>
      <h3>{question.question}</h3>
      <div className="adventure-options">
        {[question.optionA, question.optionB].map((o) => {
          const Icon = art[o.id] || Sun;
          return (
            <button
              key={o.id}
              className={`adventure-option ${selected === o.id ? "selected" : ""}`}
              aria-pressed={selected === o.id}
              onClick={() => setChoices((c) => ({ ...c, [question.id]: o.id }))}
            >
              <Icon size={76} weight="light" aria-hidden="true" />
              <span className="handwritten">{o.label}</span>
            </button>
          );
        })}
      </div>
      <div className="adventure-thread" aria-label="Your choices so far">
        {labels.filter(Boolean).map((label, i) => (
          <span key={i}>{label}</span>
        ))}
      </div>
      <div className="game-actions">
        {index > 0 && (
          <button
            className="button secondary"
            onClick={() => setIndex((i) => i - 1)}
          >
            Previous choice
          </button>
        )}
        <button
          className="button primary"
          disabled={!selected}
          onClick={() => {
            if (advancing.current || !selected) return;
            advancing.current = true;
            if (index < questions.length - 1) setIndex((i) => i + 1);
            else {
              setDone(true);
              finish("adventure");
            }
            setTimeout(() => {
              advancing.current = false;
            }, 0);
          }}
        >
          {index === questions.length - 1
            ? "Make our postcard"
            : "Next little choice"}
        </button>
        {Object.keys(progress.adventureChoices).length > 0 && (
          <button
            className="text-button"
            onClick={() => {
              setChoices(
                Object.fromEntries(
                  questions
                    .filter((q) =>
                      [q.optionA.id, q.optionB.id].includes(
                        progress.adventureChoices[q.id],
                      ),
                    )
                    .map((q) => [q.id, progress.adventureChoices[q.id]]),
                ),
              );
              setMessage(
                "Your remembered choices are back. You can change any of them.",
              );
            }}
          >
            Restore remembered choices
          </button>
        )}
      </div>
      <p role="status">{message}</p>
    </div>
  );
}
