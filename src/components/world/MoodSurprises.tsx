"use client";
import Link from "next/link";
import { useState } from "react";
import { Cloud, Sun, Moon, Heart, Flower, Star } from "@phosphor-icons/react";
import { useWorld } from "./WorldContext";
import ContentView from "./ContentView";
const choices = [
  { id: "happy", label: "Happy", Icon: Sun },
  { id: "tired", label: "Tired", Icon: Moon },
  { id: "missing", label: "Missing you", Icon: Heart },
  { id: "smile", label: "Need a smile", Icon: Flower },
  { id: "proud", label: "Feeling proud", Icon: Star },
  { id: "browsing", label: "Just browsing", Icon: Cloud },
];
export default function MoodSurprises() {
  const { data } = useWorld();
  const [mood, setMood] = useState<string | null>(null);
  const content = data.content.find(
    (content) => content.kind === "mood" && content.metadata.mood === mood,
  );
  return (
    <div className="mood-surprises">
      <h2>How&apos;s your little heart feeling today?</h2>
      <p>A choice for this moment. It isn&apos;t saved or analyzed.</p>
      <div className="mood-options">
        {choices.map(({ id, label, Icon }) => (
          <button
            key={id}
            aria-pressed={mood === id}
            className={mood === id ? "selected" : ""}
            onClick={() => setMood(id)}
          >
            <Icon size={38} weight="light" />
            <span>{label}</span>
          </button>
        ))}
      </div>
      {mood && (
        <div
          className="unfolded-paper"
          role="region"
          aria-label="Your curated surprise"
        >
          {content ? (
            <>
              <ContentView content={content} />
              {content.metadata.letterId &&
                data.content.some(
                  (letter) => letter.id === content.metadata.letterId,
                ) && (
                  <Link
                    href={`/world/letters?item=${content.metadata.letterId}`}
                  >
                    A letter for this moment
                  </Link>
                )}
              {content.metadata.activity && (
                <Link
                  href={
                    content.metadata.activity === "games"
                      ? "/#games"
                      : `/world/${content.metadata.activity}`
                  }
                >
                  Find a little activity
                </Link>
              )}
            </>
          ) : (
            <p>
              A quiet little moment is waiting here. More curated messages can
              be added in the studio.
            </p>
          )}
          <button className="text-button" onClick={() => setMood(null)}>
            Clear this choice
          </button>
        </div>
      )}
    </div>
  );
}
