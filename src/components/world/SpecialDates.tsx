"use client";
import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, ArrowRight, Heart } from "@phosphor-icons/react";
import { useWorld } from "./WorldContext";
import ContentView from "./ContentView";
import { anniversaryToday, dayNumber, occurrence } from "@/lib/world/dates";
export default function SpecialDates() {
  const { data } = useWorld();
  const [month, setMonth] = useState(data.today.slice(0, 7)),
    [selected, setSelected] = useState(data.today);
  const events = data.content.filter(
    (content) => content.kind === "dates" && content.date,
  );
  const first = new Date(`${month}-01T12:00:00Z`),
    offset = first.getUTCDay(),
    count = new Date(
      Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + 1, 0),
    ).getUTCDate();
  function step(direction: number) {
    const next = new Date(
      Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + direction, 1),
    );
    setMonth(next.toISOString().slice(0, 7));
  }
  const current = events.filter((event) =>
    anniversaryToday(event.date!, event.recurring, selected),
  );
  return (
    <div className="calendar-desk">
      <div className="paper-calendar">
        <div className="calendar-heading">
          <button
            className="icon-button"
            aria-label="Previous month"
            onClick={() => step(-1)}
          >
            <ArrowLeft size={20} />
          </button>
          <h2>
            {new Intl.DateTimeFormat("en", {
              month: "long",
              year: "numeric",
              timeZone: "UTC",
            }).format(first)}
          </h2>
          <button
            className="icon-button"
            aria-label="Next month"
            onClick={() => step(1)}
          >
            <ArrowRight size={20} />
          </button>
        </div>
        <div className="calendar-grid">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <span key={day}>{day}</span>
          ))}
          {Array.from({ length: offset }, (_, i) => (
            <span key={`space${i}`} />
          ))}
          {Array.from({ length: count }, (_, i) => {
            const day = `${month}-${String(i + 1).padStart(2, "0")}`,
              hasEvent = events.some((event) =>
                anniversaryToday(event.date!, event.recurring, day),
              );
            return (
              <button
                key={day}
                aria-label={`${day}${hasEvent ? ", special date" : ""}`}
                aria-pressed={selected === day}
                onClick={() => setSelected(day)}
              >
                {i + 1}
                {hasEvent && <Heart size={16} />}
              </button>
            );
          })}
        </div>
        <button
          className="text-button"
          onClick={() => {
            setMonth(data.today.slice(0, 7));
            setSelected(data.today);
          }}
        >
          Return to today
        </button>
      </div>
      <div className="calendar-notes">
        <h3>{selected}</h3>
        {current.length ? (
          current.map((event) => (
            <article className="unfolded-paper" key={event.id}>
              <h3>{event.title}</h3>
              <ContentView content={event} />
              {event.metadata.capsuleId && (
                <Link href={`/world/capsules?item=${event.metadata.capsuleId}`}>
                  A package for this day
                </Link>
              )}
            </article>
          ))
        ) : (
          <p>A little space for a meaningful date.</p>
        )}
        <h3>Days to look forward to</h3>
        {events.map((event) => {
          const next = occurrence(event.date!, event.recurring, data.today),
            days = dayNumber(next) - dayNumber(data.today);
          return (
            <button
              className="calendar-event text-button"
              key={event.id}
              onClick={() => {
                setMonth(next.slice(0, 7));
                setSelected(next);
              }}
            >
              <span>{event.title}</span>
              {event.demo && <small>Editable sample date</small>}
              <small>
                {days === 0
                  ? "Today"
                  : days > 0
                    ? `${days} days away`
                    : `${-days} days since`}{" "}
                · {next}
              </small>
            </button>
          );
        })}
        <p>
          Annual February 29 milestones are observed on February 28 in non-leap
          years.
        </p>
      </div>
    </div>
  );
}
