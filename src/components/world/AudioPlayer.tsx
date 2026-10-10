"use client";
import { useEffect, useId, useRef, useState } from "react";
import { Play, Pause, ArrowCounterClockwise } from "@phosphor-icons/react";
import { claimAudio } from "@/lib/world/audio";
const time = (seconds: number) =>
  Number.isFinite(seconds)
    ? `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, "0")}`
    : "0:00";
export default function AudioPlayer({
  src,
  title,
  transcript,
}: {
  src: string;
  title: string;
  transcript?: string;
}) {
  const id = useId(),
    audio = useRef<HTMLAudioElement>(null);
  const container = useRef<HTMLDivElement>(null);
  const [playing, setPlaying] = useState(false),
    [duration, setDuration] = useState(0),
    [position, setPosition] = useState(0),
    [error, setError] = useState("");
  useEffect(() => {
    const element = audio.current;
    if (element) element.volume = 0.7;
    function other(event: Event) {
      if ((event as CustomEvent).detail !== id) element?.pause();
    }
    function hidden() {
      if (document.hidden) element?.pause();
    }
    window.addEventListener("for-you:audio", other);
    document.addEventListener("visibilitychange", hidden);
    const observer = new IntersectionObserver((entries) => {
      if (!entries[0].isIntersecting) element?.pause();
    });
    if (container.current) observer.observe(container.current);
    return () => {
      element?.pause();
      observer.disconnect();
      window.removeEventListener("for-you:audio", other);
      document.removeEventListener("visibilitychange", hidden);
    };
  }, [id, src]);
  async function play() {
    setError("");
    if (!audio.current) return;
    if (!audio.current.paused) {
      audio.current.pause();
      return;
    }
    claimAudio(id);
    try {
      await audio.current.play();
    } catch {
      setError(
        "This recording could not play. Try again or ask the owner to replace the file.",
      );
    }
  }
  return (
    <div className="world-audio" ref={container}>
      <audio
        ref={audio}
        src={src}
        preload="none"
        onPlay={() => {
          claimAudio(id);
          setPlaying(true);
        }}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
        onLoadedMetadata={() => setDuration(audio.current?.duration || 0)}
        onTimeUpdate={() => setPosition(audio.current?.currentTime || 0)}
        onError={() =>
          setError(
            "This audio file is unavailable or unsupported by your browser.",
          )
        }
      />
      <p>{title}</p>
      <div
        className={`waveform ${playing ? "playing" : ""}`}
        aria-hidden="true"
      >
        {Array.from({ length: 18 }, (_, i) => (
          <i
            key={i}
            style={{
              height: `${10 + ((i * 7) % 25)}px`,
              animationDelay: `${i * 0.06}s`,
            }}
          />
        ))}
      </div>
      <div className="world-audio-controls">
        <button
          className="icon-button"
          aria-label={`${playing ? "Pause" : "Play"} ${title}`}
          onClick={() => void play()}
        >
          {playing ? <Pause size={22} /> : <Play size={22} />}
        </button>
        <label className="sr-only" htmlFor={`${id}-seek`}>
          Recording progress
        </label>
        <input
          id={`${id}-seek`}
          type="range"
          min={0}
          max={duration || 1}
          step="0.1"
          value={position}
          disabled={!duration}
          onChange={(event) => {
            if (audio.current)
              audio.current.currentTime = Number(event.target.value);
            setPosition(Number(event.target.value));
          }}
        />
        <span>
          {time(position)} / {time(duration)}
        </span>
        <button
          className="icon-button"
          aria-label={`Replay ${title}`}
          onClick={() => {
            if (audio.current) audio.current.currentTime = 0;
            void (async () => {
              claimAudio(id);
              try {
                await audio.current?.play();
              } catch {
                setError("The recording could not replay.");
              }
            })();
          }}
        >
          <ArrowCounterClockwise size={20} />
        </button>
      </div>
      <label className="audio-volume">
        Volume{" "}
        <input
          type="range"
          aria-label={`Volume for ${title}`}
          min="0"
          max="1"
          step=".05"
          defaultValue=".7"
          onChange={(event) => {
            if (audio.current)
              audio.current.volume = Number(event.target.value);
          }}
        />
      </label>
      {transcript && (
        <details>
          <summary>Read transcript</summary>
          <p className="selectable-copy">{transcript}</p>
        </details>
      )}
      <p role="alert">{error}</p>
    </div>
  );
}
