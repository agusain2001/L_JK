"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useWorld } from "./WorldContext";
export default function CloudCompanion() {
  const { data } = useWorld();
  const [visible, setVisible] = useState(true),
    [open, setOpen] = useState(false),
    [hint, setHint] = useState(0);
  const cloud = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        setVisible(localStorage.getItem("for-you-cloud") !== "hidden");
      } catch {}
    }, 0);
    return () => clearTimeout(timer);
  }, []);
  function hide() {
    setVisible(false);
    setOpen(false);
    try {
      localStorage.setItem("for-you-cloud", "hidden");
    } catch {}
  }
  if (data.flags.companion === false) return null;
  return (
    <aside className="cloud-companion" aria-label="Tiny cloud companion">
      {visible ? (
        <>
          <button
            ref={cloud}
            className="cloud-character"
            aria-label="Ask the tiny cloud for a hint"
            aria-expanded={open}
            onClick={() => {
              setOpen((value) => !value);
              setHint(
                (value) => (value + 1) % data.settings.companionHints.length,
              );
            }}
            onPointerMove={(event) => {
              if (
                event.pointerType !== "mouse" ||
                matchMedia("(prefers-reduced-motion: reduce)").matches
              )
                return;
              const box = event.currentTarget.getBoundingClientRect();
              event.currentTarget.style.setProperty(
                "--cloud-tilt",
                `${((event.clientX - box.left) / box.width - 0.5) * 8}deg`,
              );
            }}
            onPointerLeave={() =>
              cloud.current?.style.setProperty("--cloud-tilt", "0deg")
            }
          >
            <span className="cloud-cheek left" />
            <span className="cloud-cheek right" />
            <span className="cloud-eyes">• •</span>
            <span className="cloud-smile" />
          </button>
          {open && (
            <div className="cloud-speech">
              <p>{data.settings.companionHints[hint]}</p>
              <Link href="/#home">Back to our sky</Link>
              <Link href="/#games">Find another little game</Link>
              <button className="text-button" onClick={() => setOpen(false)}>
                Close hint
              </button>
            </div>
          )}
          <button className="text-button" onClick={hide}>
            Let my cloud rest
          </button>
        </>
      ) : (
        <button
          className="text-button"
          onClick={() => {
            setVisible(true);
            try {
              localStorage.setItem("for-you-cloud", "visible");
            } catch {}
          }}
        >
          Wake my tiny cloud
        </button>
      )}
    </aside>
  );
}
