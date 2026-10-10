"use client";
import { useState } from "react";
import { useWorld } from "./WorldContext";
import ContentView from "./ContentView";
import { chooseDaily } from "@/lib/world/daily";
export default function DailyNote() {
  const { data, refresh } = useWorld();
  const [open, setOpen] = useState(false),
    [archive, setArchive] = useState<string | null>(null),
    [message, setMessage] = useState("");
  const note = archive ? chooseDaily(data.content, archive) : data.daily;
  const dates = Array.from({ length: 14 }, (_, i) =>
    new Date(Date.parse(`${data.today}T12:00:00Z`) - i * 86400000)
      .toISOString()
      .slice(0, 10),
  );
  return (
    <div className="daily-corner">
      <p className="world-kicker">
        {archive || data.today} · {data.settings.timeZone}
      </p>
      {note ? (
        <>
          <button
            className={`daily-fold ${open ? "open" : ""}`}
            aria-expanded={open}
            onClick={() => setOpen((value) => !value)}
          >
            <span className="handwritten">A little note for today ♡</span>
            <span>{open ? "Tap to fold" : "Tap to unfold your note"}</span>
          </button>
          {open && (
            <div className="unfolded-paper">
              <h2>{note.title}</h2>
              <ContentView content={note} />
            </div>
          )}
        </>
      ) : (
        <p>
          A quiet little page today. New notes can be prepared in the studio.
        </p>
      )}
      <details className="daily-archive">
        <summary>Revisit a previous little note</summary>
        <div>
          {dates.map((date) => (
            <button
              key={date}
              className="text-button"
              onClick={() => {
                setArchive(date);
                setOpen(true);
              }}
            >
              {date}
            </button>
          ))}
        </div>
        <p>
          Notes are selected from the currently available curated collection.
        </p>
      </details>
      <button
        className="text-button"
        onClick={() =>
          void refresh()
            .then(() => {
              setArchive(null);
              setMessage("Today's note is refreshed in the website time zone.");
            })
            .catch((error) => setMessage(error.message))
        }
      >
        Return to today
      </button>
      <p role="status">{message}</p>
    </div>
  );
}
