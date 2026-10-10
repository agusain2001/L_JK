export function calendarDay(now: Date, timeZone: string) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}
export function dayNumber(day: string) {
  return Math.floor(Date.parse(`${day}T12:00:00Z`) / 86400000);
}
export function occurrence(date: string, recurring: boolean, today: string) {
  if (!recurring) return date;
  const monthDay = date.slice(5);
  let year = Number(today.slice(0, 4));
  function inYear(y: number) {
    const candidate = `${y}-${monthDay}`;
    return new Date(`${candidate}T12:00:00Z`).toISOString().slice(0, 10) ===
      candidate
      ? candidate
      : `${y}-02-28`;
  }
  let next = inYear(year);
  if (next < today) next = inYear(++year);
  return next;
}
export function anniversaryToday(
  date: string,
  recurring: boolean,
  today: string,
) {
  return recurring ? occurrence(date, true, today) === today : date === today;
}
export function deterministicIndex(day: string, length: number) {
  return length ? ((dayNumber(day) % length) + length) % length : 0;
}
export function visibleCoordinates(location: {
  latitude: number | null;
  longitude: number | null;
  precision: string;
}) {
  if (
    location.precision === "hidden" ||
    location.latitude === null ||
    location.longitude === null
  )
    return { latitude: null, longitude: null };
  const factor =
    location.precision === "city"
      ? 10
      : location.precision === "approximate"
        ? 100
        : 1000000;
  return {
    latitude: Math.round(location.latitude * factor) / factor,
    longitude: Math.round(location.longitude * factor) / factor,
  };
}
