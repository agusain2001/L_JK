import type { WorldContent } from "./schemas";
import { deterministicIndex, anniversaryToday } from "./dates";
export function chooseDaily(content: WorldContent[], today: string) {
  const notes = content.filter((note) => note.kind === "today");
  return (
    notes.find(
      (note) => note.date && anniversaryToday(note.date, note.recurring, today),
    ) ||
    notes.find((note) => note.featured && !note.date) ||
    (() => {
      const pool = notes.filter(
        (note) => !note.date || (note.date <= today && !note.recurring),
      );
      return pool[deterministicIndex(today, pool.length)];
    })()
  );
}
