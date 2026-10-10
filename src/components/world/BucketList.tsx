"use client";
import { useEffect, useState } from "react";
import {
  Check,
  PencilSimple,
  Trash,
  ArrowUp,
  ArrowDown,
} from "@phosphor-icons/react";
import type { BucketListItem } from "@prisma/client";
import { useWorld, worldRequest } from "./WorldContext";
import { InvitationHint } from "./ContentView";
const blank = {
  title: "",
  description: "",
  category: "Little adventures",
  completed: false,
  order: 0,
  targetDate: "",
  memoryId: "",
};
export default function BucketList() {
  const { data, ready, refresh } = useWorld();
  const [items, setItems] = useState<BucketListItem[]>([]),
    [draft, setDraft] = useState<typeof blank & { id?: string }>(blank),
    [filter, setFilter] = useState("all"),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false);
  async function load() {
    try {
      setItems(await worldRequest("/api/world/bucket-list", "GET"));
    } catch (error) {
      setMessage((error as Error).message);
    }
  }
  useEffect(() => {
    const timer = setTimeout(() => {
      if (data.actor) void load();
    }, 0);
    return () => clearTimeout(timer);
  }, [data.actor]);
  async function save(input: unknown) {
    setBusy(true);
    try {
      await worldRequest("/api/world/bucket-list", "POST", input);
      await load();
      await refresh();
      setMessage("Your idea is saved in the shared notebook.");
      return true;
    } catch (error) {
      setMessage((error as Error).message);
      return false;
    } finally {
      setBusy(false);
    }
  }
  if (!data.actor) return <InvitationHint />;
  const editable = data.actor.role === "owner" || data.settings.sharedBucket;
  return (
    <div className="bucket-notebook">
      <div className="bucket-page">
        <div className="world-filter" aria-label="Filter ideas">
          {["all", "waiting", "completed"].map((value) => (
            <button
              className="text-button"
              key={value}
              aria-pressed={filter === value}
              onClick={() => setFilter(value)}
            >
              {value}
            </button>
          ))}
        </div>
        {items
          .filter(
            (item) =>
              filter === "all" || item.completed === (filter === "completed"),
          )
          .map((item) => (
            <article
              className={`bucket-idea ${item.completed ? "completed" : ""}`}
              key={item.id}
            >
              <button
                className="paper-checkbox"
                aria-label={`${item.completed ? "Reopen" : "Complete"} ${item.title}`}
                aria-pressed={item.completed}
                disabled={!editable || busy}
                onClick={() =>
                  void save({ ...item, completed: !item.completed })
                }
              >
                {item.completed && <Check size={24} />}
              </button>
              <div>
                <small>
                  {item.category}
                  {item.targetDate ? ` · ${item.targetDate}` : ""}
                </small>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
                {item.completed && (
                  <p className="handwritten">
                    One more beautiful memory made ♡
                  </p>
                )}
                {item.memoryId && (
                  <p>
                    Memory:{" "}
                    {data.memories.find((memory) => memory.id === item.memoryId)
                      ?.title || "A private or unavailable memory"}
                  </p>
                )}
                <div className="world-actions">
                  {editable && (
                    <>
                      <button
                        className="icon-button"
                        aria-label={`Edit ${item.title}`}
                        onClick={() =>
                          setDraft({
                            ...item,
                            targetDate: item.targetDate || "",
                            memoryId: item.memoryId || "",
                          })
                        }
                      >
                        <PencilSimple size={20} />
                      </button>
                      <button
                        className="icon-button"
                        aria-label={`Delete ${item.title}`}
                        onClick={() =>
                          void worldRequest(
                            "/api/world/bucket-list",
                            "DELETE",
                            { id: item.id },
                          )
                            .then(load)
                            .catch((error) => setMessage(error.message))
                        }
                      >
                        <Trash size={20} />
                      </button>
                      <button
                        className="icon-button"
                        aria-label={`Move ${item.title} earlier`}
                        disabled={
                          items.findIndex((row) => row.id === item.id) === 0 ||
                          busy
                        }
                        onClick={() =>
                          void (async () => {
                            const ordered = [...items];
                            const index = ordered.findIndex(
                              (row) => row.id === item.id,
                            );
                            [ordered[index - 1], ordered[index]] = [
                              ordered[index],
                              ordered[index - 1],
                            ];
                            await save({
                              action: "reorder",
                              ids: ordered.map((row) => row.id),
                            });
                          })()
                        }
                      >
                        <ArrowUp size={18} />
                      </button>
                      <button
                        className="icon-button"
                        aria-label={`Move ${item.title} later`}
                        disabled={
                          items.findIndex((row) => row.id === item.id) ===
                            items.length - 1 || busy
                        }
                        onClick={() =>
                          void (async () => {
                            const ordered = [...items];
                            const index = ordered.findIndex(
                              (row) => row.id === item.id,
                            );
                            [ordered[index + 1], ordered[index]] = [
                              ordered[index],
                              ordered[index + 1],
                            ];
                            await save({
                              action: "reorder",
                              ids: ordered.map((row) => row.id),
                            });
                          })()
                        }
                      >
                        <ArrowDown size={18} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </article>
          ))}
        {!items.length && (
          <p>A fresh page. Add an idea you would like to make real.</p>
        )}
      </div>
      {editable && (
        <form
          className="bucket-writing"
          onSubmit={(event) => {
            event.preventDefault();
            const form = new FormData(event.currentTarget);
            void save({
              ...draft,
              title: String(form.get("title") || ""),
              description: String(form.get("description") || ""),
              category: String(form.get("category") || ""),
              targetDate: form.get("targetDate") || null,
              memoryId: form.get("memoryId") || null,
              order: draft.id ? draft.order : items.length,
            }).then((saved) => {
              if (saved) setDraft(blank);
            });
          }}
        >
          <h3>{draft.id ? "Edit our idea" : "One day, let's…"}</h3>
          <label>
            Our idea
            <input
              required
              readOnly={!ready}
              maxLength={140}
              value={draft.title}
              name="title"
              onChange={(event) =>
                setDraft({ ...draft, title: event.target.value })
              }
            />
          </label>
          <label>
            A few details
            <textarea
              maxLength={1000}
              value={draft.description}
              name="description"
              onChange={(event) =>
                setDraft({ ...draft, description: event.target.value })
              }
            />
          </label>
          <label>
            Category
            <input
              maxLength={60}
              value={draft.category}
              name="category"
              onChange={(event) =>
                setDraft({ ...draft, category: event.target.value })
              }
            />
          </label>
          <label>
            Optional target day
            <input
              type="date"
              value={draft.targetDate}
              name="targetDate"
              onChange={(event) =>
                setDraft({ ...draft, targetDate: event.target.value })
              }
            />
          </label>
          <label>
            Related approved memory
            <select
              value={draft.memoryId}
              name="memoryId"
              onChange={(event) =>
                setDraft({ ...draft, memoryId: event.target.value })
              }
            >
              <option value="">No photograph yet</option>
              {data.memories.map((memory) => (
                <option key={memory.id} value={memory.id}>
                  {memory.title}
                </option>
              ))}
            </select>
          </label>
          <button className="button primary" disabled={busy || !ready}>
            {busy ? "Saving…" : draft.id ? "Save our idea" : "Add our idea"}
          </button>
          {draft.id && (
            <button
              type="button"
              className="text-button"
              onClick={() => setDraft(blank)}
            >
              Cancel editing
            </button>
          )}
        </form>
      )}
      <p className="world-form-status" role="status">
        {message}
      </p>
    </div>
  );
}
