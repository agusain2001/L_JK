"use client";
import { useEffect, useState } from "react";
import {
  gameConfigSchema,
  chapters,
  type GameConfig,
  type QuizQuestion,
  type MemoryPuzzle,
} from "@/lib/games/schemas";
import type { MemoryMedia } from "@/types/memory";
const feedback = {
  correct: "You remembered that little detail. ♡",
  incorrect: "A new little detail to keep. Try the next one.",
  opinion: "That sounds lovely. ♡",
};
function Answers({
  options,
  onChange,
}: {
  options: QuizQuestion["options"];
  onChange: (v: QuizQuestion["options"]) => void;
}) {
  return (
    <div className="editor-answers">
      {options.map((o, i) => (
        <div key={o.id}>
          <label>
            Answer {i + 1}
            <input
              value={o.label}
              maxLength={500}
              onChange={(e) =>
                onChange(
                  options.map((x) =>
                    x.id === o.id ? { ...x, label: e.target.value } : x,
                  ),
                )
              }
            />
          </label>
          <button
            type="button"
            className="admin-button"
            disabled={options.length <= 2}
            aria-label={`Remove answer ${i + 1}`}
            onClick={() => onChange(options.filter((x) => x.id !== o.id))}
          >
            Remove
          </button>
        </div>
      ))}
      <button
        type="button"
        className="admin-button"
        disabled={options.length >= 4}
        onClick={() =>
          onChange([
            ...options,
            { id: crypto.randomUUID(), label: "Another answer" },
          ])
        }
      >
        Add answer
      </button>
    </div>
  );
}
export default function GameEditor() {
  const [config, setConfig] = useState<GameConfig | null>(null),
    [media, setMedia] = useState<MemoryMedia[]>([]),
    [tab, setTab] = useState("availability"),
    [status, setStatus] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [raw, setRaw] = useState("");
  async function load() {
    setError("");
    try {
      const r = await fetch("/api/admin/games");
      const data = await r.json();
      if (!r.ok) throw new Error(data.error);
      setConfig(gameConfigSchema.parse(data.config));
      setMedia(data.media);
    } catch (e) {
      setError((e as Error).message);
    }
  }
  useEffect(() => {
    const timer = setTimeout(() => void load(), 0);
    return () => clearTimeout(timer);
  }, []);
  async function save() {
    if (!config || busy) return;
    setError("");
    setStatus("");
    const parsed = gameConfigSchema.safeParse(config);
    if (!parsed.success) {
      setError(
        parsed.error.issues
          .map((x) => `${x.path.join(".")}: ${x.message}`)
          .slice(0, 4)
          .join(" "),
      );
      return;
    }
    setBusy(true);
    try {
      const r = await fetch("/api/admin/games", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error);
      setStatus(
        "Playground content saved. Refresh the story to see your changes.",
      );
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  const photos = media.filter((m) => m.kind === "image");
  function mediaSelect(
    value: string | undefined,
    change: (id: string) => void,
    optional = false,
  ) {
    return (
      <label>
        Approved photograph
        <select value={value || ""} onChange={(e) => change(e.target.value)}>
          {optional && <option value="">No photo</option>}
          {value && !photos.some((p) => p.id === value) && (
            <option value={value}>Unavailable photo ({value})</option>
          )}
          {photos.map((p) => (
            <option value={p.id} key={p.id}>
              {p.demo ? "Sample: " : ""}
              {p.title || p.id}
            </option>
          ))}
        </select>
      </label>
    );
  }
  function updateQuiz(index: number, q: QuizQuestion) {
    if (config)
      setConfig({
        ...config,
        quizQuestions: config.quizQuestions.map((v, i) =>
          i === index ? q : v,
        ),
      });
  }
  function updatePuzzle(index: number, p: MemoryPuzzle) {
    if (config)
      setConfig({
        ...config,
        puzzles: config.puzzles.map((v, i) => (i === index ? p : v)),
      });
  }
  return (
    <section className="game-editor">
      <div className="editor-header">
        <div>
          <span className="handwritten">
            the little things you can make yours
          </span>
          <h2>Your playground studio.</h2>
          <p>
            Personal facts, correct answers, and clues are yours to write. Only
            approved photos can be used. Changes publish when you save.
          </p>
        </div>
        {config && (
          <button
            className="button primary"
            disabled={busy}
            onClick={() => void save()}
          >
            {busy ? "Saving…" : "Save playground content"}
          </button>
        )}
      </div>
      <p className="admin-error" role="alert">
        {error}
      </p>
      <p className="admin-status" role="status">
        {status}
      </p>
      {!config ? (
        <>
          <p>Loading playground content…</p>
          <button className="admin-button" onClick={() => void load()}>
            Try loading again
          </button>
        </>
      ) : (
        <>
          <div className="editor-tabs" aria-label="Playground content sections">
            {[
              "availability",
              "questions",
              "memory clues",
              "hidden hearts",
              "romantic notes",
              "adventures",
              "advanced",
            ].map((t) => (
              <button
                className={`admin-button ${tab === t ? "editor-tab-active" : ""}`}
                aria-pressed={tab === t}
                key={t}
                onClick={() => {
                  setTab(t);
                  if (t === "advanced") setRaw(JSON.stringify(config, null, 2));
                }}
              >
                {t}
              </button>
            ))}
          </div>
          {tab === "availability" && (
            <div className="editor-grid">
              {config.games.map((g, i) => (
                <fieldset key={g.id}>
                  <legend>{g.id}</legend>
                  <label className="editor-checkbox">
                    <input
                      type="checkbox"
                      checked={g.enabled}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          games: config.games.map((x, j) =>
                            i === j ? { ...x, enabled: e.target.checked } : x,
                          ),
                        })
                      }
                    />
                    Available to play
                  </label>
                  {(["title", "description"] as const).map((k) => (
                    <label key={k}>
                      {k}
                      <input
                        value={g[k]}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            games: config.games.map((x, j) =>
                              i === j ? { ...x, [k]: e.target.value } : x,
                            ),
                          })
                        }
                      />
                    </label>
                  ))}
                  <label>
                    Display order
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={g.displayOrder}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          games: config.games.map((x, j) =>
                            i === j
                              ? { ...x, displayOrder: Number(e.target.value) }
                              : x,
                          ),
                        })
                      }
                    />
                  </label>
                  <label>
                    Paper color
                    <select
                      value={g.themeVariant}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          games: config.games.map((x, j) =>
                            i === j
                              ? {
                                  ...x,
                                  themeVariant: e.target
                                    .value as typeof x.themeVariant,
                                }
                              : x,
                          ),
                        })
                      }
                    >
                      {["peach", "cream", "sage"].map((t) => (
                        <option key={t}>{t}</option>
                      ))}
                    </select>
                  </label>
                </fieldset>
              ))}
            </div>
          )}
          {tab === "questions" && (
            <>
              <p className="admin-hint">
                Leave the correct answer blank for opinion questions. Sample
                fact questions only refer to the sample gallery.
              </p>
              <button
                className="admin-button"
                disabled={config.quizQuestions.length >= 30}
                onClick={() =>
                  setConfig({
                    ...config,
                    quizQuestions: [
                      ...config.quizQuestions,
                      {
                        id: crypto.randomUUID(),
                        question: "Your real question",
                        options: [
                          { id: "a", label: "First answer" },
                          { id: "b", label: "Second answer" },
                        ],
                        feedback,
                      },
                    ],
                  })
                }
              >
                Add quiz question
              </button>
              <div className="editor-grid">
                {config.quizQuestions.map((q, i) => (
                  <fieldset key={q.id}>
                    <legend>Question {i + 1}</legend>
                    <label>
                      Question text
                      <textarea
                        aria-label="Question text"
                        value={q.question}
                        onChange={(e) =>
                          updateQuiz(i, { ...q, question: e.target.value })
                        }
                      />
                    </label>
                    {mediaSelect(
                      q.imageId,
                      (id) => updateQuiz(i, { ...q, imageId: id || undefined }),
                      true,
                    )}
                    <Answers
                      options={q.options}
                      onChange={(options) =>
                        updateQuiz(i, {
                          ...q,
                          options,
                          correctAnswerId: options.some(
                            (o) => o.id === q.correctAnswerId,
                          )
                            ? q.correctAnswerId
                            : undefined,
                        })
                      }
                    />
                    <label>
                      Correct answer
                      <select
                        value={q.correctAnswerId || ""}
                        onChange={(e) =>
                          updateQuiz(i, {
                            ...q,
                            correctAnswerId: e.target.value || undefined,
                          })
                        }
                      >
                        <option value="">Opinion — no score</option>
                        {q.options.map((o) => (
                          <option key={o.id} value={o.id}>
                            {o.label}
                          </option>
                        ))}
                      </select>
                    </label>
                    {(["correct", "incorrect", "opinion"] as const).map((k) => (
                      <label key={k}>
                        {k} feedback
                        <textarea
                          value={q.feedback[k]}
                          onChange={(e) =>
                            updateQuiz(i, {
                              ...q,
                              feedback: { ...q.feedback, [k]: e.target.value },
                            })
                          }
                        />
                      </label>
                    ))}
                    <button
                      className="admin-button"
                      onClick={() =>
                        setConfig({
                          ...config,
                          quizQuestions: config.quizQuestions.filter(
                            (x) => x.id !== q.id,
                          ),
                        })
                      }
                    >
                      Remove question {i + 1}
                    </button>
                  </fieldset>
                ))}
              </div>
            </>
          )}
          {tab === "memory clues" && (
            <>
              <button
                className="admin-button"
                disabled={!photos.length || config.puzzles.length >= 30}
                onClick={() =>
                  setConfig({
                    ...config,
                    puzzles: [
                      ...config.puzzles,
                      {
                        id: crypto.randomUUID(),
                        approvedMediaId: photos[0].id,
                        question: "Which real memory is this?",
                        clues: ["Write an actual clue here."],
                        possibleAnswers: [
                          { id: "a", label: "The correct memory" },
                          { id: "b", label: "Another memory" },
                        ],
                        correctAnswerId: "a",
                        revealMessage: "Your own note about this photograph.",
                      },
                    ],
                  })
                }
              >
                Add memory puzzle
              </button>
              <div className="editor-grid">
                {config.puzzles.map((p, i) => (
                  <fieldset key={p.id}>
                    <legend>Memory puzzle {i + 1}</legend>
                    {mediaSelect(p.approvedMediaId, (id) =>
                      updatePuzzle(i, { ...p, approvedMediaId: id }),
                    )}
                    <label>
                      Question text
                      <textarea
                        aria-label="Question text"
                        value={p.question}
                        onChange={(e) =>
                          updatePuzzle(i, { ...p, question: e.target.value })
                        }
                      />
                    </label>
                    <label>
                      Clues — one per line
                      <textarea
                        rows={4}
                        value={p.clues.join("\n")}
                        onChange={(e) =>
                          updatePuzzle(i, {
                            ...p,
                            clues: e.target.value.split("\n"),
                          })
                        }
                      />
                    </label>
                    <Answers
                      options={p.possibleAnswers}
                      onChange={(possibleAnswers) =>
                        updatePuzzle(i, {
                          ...p,
                          possibleAnswers,
                          correctAnswerId: possibleAnswers.some(
                            (o) => o.id === p.correctAnswerId,
                          )
                            ? p.correctAnswerId
                            : possibleAnswers[0].id,
                        })
                      }
                    />
                    <label>
                      Correct answer
                      <select
                        value={p.correctAnswerId}
                        onChange={(e) =>
                          updatePuzzle(i, {
                            ...p,
                            correctAnswerId: e.target.value,
                          })
                        }
                      >
                        {p.possibleAnswers.map((o) => (
                          <option key={o.id} value={o.id}>
                            {o.label}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label>
                      Revealed romantic note
                      <textarea
                        value={p.revealMessage}
                        onChange={(e) =>
                          updatePuzzle(i, {
                            ...p,
                            revealMessage: e.target.value,
                          })
                        }
                      />
                    </label>
                    <button
                      className="admin-button"
                      onClick={() =>
                        setConfig({
                          ...config,
                          puzzles: config.puzzles.filter((x) => x.id !== p.id),
                        })
                      }
                    >
                      Remove puzzle {i + 1}
                    </button>
                  </fieldset>
                ))}
              </div>
            </>
          )}
          {tab === "hidden hearts" && (
            <div className="editor-grid">
              {config.hearts.map((h, i) => (
                <fieldset key={h.id}>
                  <legend>Hidden heart {i + 1}</legend>
                  <label className="editor-checkbox">
                    <input
                      type="checkbox"
                      checked={h.enabled}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          hearts: config.hearts.map((x, j) =>
                            i === j ? { ...x, enabled: e.target.checked } : x,
                          ),
                        })
                      }
                    />
                    Enabled
                  </label>
                  <label>
                    Chapter
                    <select
                      value={h.chapterId}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          hearts: config.hearts.map((x, j) =>
                            i === j
                              ? {
                                  ...x,
                                  chapterId: e.target
                                    .value as typeof h.chapterId,
                                }
                              : x,
                          ),
                        })
                      }
                    >
                      {chapters.map((c) => (
                        <option key={c}>{c}</option>
                      ))}
                    </select>
                  </label>
                  {(["x", "y"] as const).map((k) => (
                    <label key={k}>
                      {k === "x" ? "Left position (%)" : "Top position (%)"}
                      <input
                        type="number"
                        min={5}
                        max={95}
                        value={h.position[k]}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            hearts: config.hearts.map((x, j) =>
                              i === j
                                ? {
                                    ...x,
                                    position: {
                                      ...x.position,
                                      [k]: Number(e.target.value),
                                    },
                                  }
                                : x,
                            ),
                          })
                        }
                      />
                    </label>
                  ))}
                  <label>
                    Heart note
                    <textarea
                      value={h.message}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          hearts: config.hearts.map((x, j) =>
                            i === j ? { ...x, message: e.target.value } : x,
                          ),
                        })
                      }
                    />
                  </label>
                </fieldset>
              ))}
            </div>
          )}
          {tab === "romantic notes" && (
            <div className="editor-grid">
              {Object.entries(config.messages).map(([key, value]) => (
                <label key={key}>
                  {key} reward message
                  <textarea
                    rows={4}
                    value={value}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        messages: { ...config.messages, [key]: e.target.value },
                      })
                    }
                  />
                </label>
              ))}
            </div>
          )}
          {tab === "adventures" && (
            <div className="editor-grid">
              {config.adventureQuestions.map((q, i) => (
                <fieldset key={q.id}>
                  <legend>Adventure choice {i + 1}</legend>
                  <label>
                    Question
                    <input
                      value={q.question}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          adventureQuestions: config.adventureQuestions.map(
                            (x, j) =>
                              i === j ? { ...x, question: e.target.value } : x,
                          ),
                        })
                      }
                    />
                  </label>
                  {(["optionA", "optionB"] as const).map((key) => (
                    <label key={key}>
                      {key === "optionA" ? "Choice A" : "Choice B"}
                      <input
                        value={q[key].label}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            adventureQuestions: config.adventureQuestions.map(
                              (x, j) =>
                                i === j
                                  ? {
                                      ...x,
                                      [key]: {
                                        ...x[key],
                                        label: e.target.value,
                                      },
                                    }
                                  : x,
                            ),
                          })
                        }
                      />
                    </label>
                  ))}
                </fieldset>
              ))}
            </div>
          )}
          {tab === "advanced" && (
            <>
              <p>
                Edit the complete validated JSON, including flower colors and
                meanings. Apply changes here, then Save playground content.
              </p>
              <label>
                Playground JSON
                <textarea
                  rows={22}
                  spellCheck={false}
                  value={raw}
                  onChange={(e) => setRaw(e.target.value)}
                />
              </label>
              <button
                className="admin-button"
                onClick={() => {
                  try {
                    setConfig(gameConfigSchema.parse(JSON.parse(raw)));
                    setError("");
                    setStatus(
                      "Valid content applied to the editor. Save to publish it.",
                    );
                  } catch (e) {
                    setError((e as Error).message);
                  }
                }}
              >
                Validate and apply JSON
              </button>
            </>
          )}
          <button
            className="admin-button editor-cleanup"
            onClick={() => {
              const ids = new Set(photos.map((p) => p.id));
              setConfig({
                ...config,
                quizQuestions: config.quizQuestions.filter(
                  (q) => !q.imageId || ids.has(q.imageId),
                ),
                puzzles: config.puzzles.filter((p) =>
                  ids.has(p.approvedMediaId),
                ),
              });
              setStatus(
                "Unavailable photo references removed from this draft. Save to publish.",
              );
            }}
          >
            Remove questions referencing unavailable photos
          </button>
        </>
      )}
    </section>
  );
}
