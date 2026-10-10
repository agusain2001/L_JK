"use client";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { EnvelopeSimple } from "@phosphor-icons/react";
import { useWorld } from "./WorldContext";
import ContentView from "./ContentView";
export default function Letters() {
  const { data } = useWorld();
  const item = useSearchParams().get("item");
  const letters = data.content.filter((content) => content.kind === "letters");
  const selected = letters.find((letter) => letter.id === item);
  return selected ? (
    <div className={`opened-letter paper-${selected.color}`}>
      <Link className="text-button" href="/world/letters">
        Fold this letter & return
      </Link>
      <div className="unfolded-paper">
        <span className="handwritten">a little envelope, opened for you ♡</span>
        <h2>{selected.title}</h2>
        <ContentView content={selected} print />
      </div>
    </div>
  ) : (
    <div className="envelope-collection">
      {letters.map((letter) => (
        <Link
          href={`/world/letters?item=${letter.id}`}
          className={`world-envelope paper-${letter.color}`}
          key={letter.id}
        >
          <span className="envelope-flap" />
          <EnvelopeSimple size={32} weight="light" />
          <span className="handwritten">{letter.title}</span>
          <small>{letter.demo ? "Sample letter" : "Open your letter"}</small>
        </Link>
      ))}
      {!letters.length && (
        <p>
          There are no letters available for this visitor yet. The owner can
          prepare one in the studio.
        </p>
      )}
    </div>
  );
}
