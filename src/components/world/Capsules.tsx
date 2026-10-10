"use client";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { Gift, LockKey, ArrowCounterClockwise } from "@phosphor-icons/react";
import { useWorld, worldRequest } from "./WorldContext";
import ContentView from "./ContentView";
import type { WorldContent } from "@/lib/world/schemas";
export default function Capsules() {
  const { data, refresh } = useWorld();
  const item = useSearchParams().get("item");
  const [opened, setOpened] = useState<WorldContent | null>(null),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false),
    [replay, setReplay] = useState(0);
  const capsules = data.content.filter(
    (content) => content.kind === "capsules",
  );
  async function open(id: string) {
    setBusy(true);
    setMessage("");
    try {
      const content = await worldRequest(`/api/world/content/${id}`, "GET");
      setOpened(content);
      if (data.actor) await worldRequest(`/api/world/content/${id}`);
      setReplay((value) => value + 1);
    } catch (error) {
      setMessage((error as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <div className="capsule-collection">
        {capsules
          .filter((capsule) => !item || item === capsule.id)
          .map((capsule) => (
            <article
              className={`capsule-package ${capsule.locked ? "locked" : "ready"}`}
              key={capsule.id}
            >
              <div className="gift-ribbon" aria-hidden="true" />
              <Gift size={72} weight="light" />
              <h3>{capsule.title}</h3>
              <p>{capsule.description}</p>
              {capsule.demo && <small>Sample capsule</small>}
              <p className="capsule-date">
                {capsule.unlockAt &&
                  new Intl.DateTimeFormat("en", {
                    dateStyle: "long",
                    timeStyle: "short",
                    timeZone: capsule.timeZone,
                  }).format(new Date(capsule.unlockAt))}
                <br />
                <small>{capsule.timeZone}</small>
              </p>
              {capsule.locked ? (
                <p>
                  <LockKey size={17} />
                  {capsule.status === "revoked"
                    ? "This package has been withdrawn."
                    : "Safely waiting for its release day."}
                </p>
              ) : (
                <button
                  className="button primary"
                  disabled={busy}
                  onClick={() => void open(capsule.id)}
                >
                  Open this capsule
                </button>
              )}
            </article>
          ))}
      </div>
      {opened && (
        <div key={replay} className="capsule-reveal unfolded-paper">
          <h2>{opened.title}</h2>
          <ContentView content={opened} />
          <div className="world-actions">
            <button
              className="text-button"
              onClick={() => setReplay((value) => value + 1)}
            >
              <ArrowCounterClockwise size={18} /> Replay the opening
            </button>
            <button className="text-button" onClick={() => setOpened(null)}>
              Close this package
            </button>
          </div>
        </div>
      )}
      <div className="world-actions">
        <button
          className="text-button"
          onClick={() =>
            void refresh()
              .then(() => setMessage("Release times checked with the server."))
              .catch((error) => setMessage(error.message))
          }
        >
          Check release times
        </button>
        {item && <Link href="/world/capsules">All packages</Link>}
      </div>
      <p role="status">{message}</p>
      {!capsules.length && (
        <p>No packages are available for this visitor yet.</p>
      )}
    </>
  );
}
