"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, type ReactNode } from "react";
import ExperienceMotion from "../ExperienceMotion";
import { WorldProvider } from "./WorldContext";
import CloudCompanion from "./CloudCompanion";
import { pauseAudio } from "@/lib/world/audio";
import type { WorldData } from "@/lib/world/repository";
export default function WorldShell({
  initial,
  children,
}: {
  initial: WorldData;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const root = useRef<HTMLElement>(null);
  useEffect(() => {
    pauseAudio();
  }, [pathname]);
  return (
    <WorldProvider initial={initial}>
      <main ref={root} className="little-world">
        <ExperienceMotion root={root} />
        <header className="world-header">
          <Link className="wordmark" href="/">
            for you <span>♡</span>
          </Link>
          <nav aria-label="Little World navigation">
            <Link href="/world">Our little world</Link>
            <Link href="/#games">Little games</Link>
            <Link href="/#letter">Our letter</Link>
            <Link href="/world/access">
              {initial.actor ? initial.actor.name : "Your invitation"}
            </Link>
          </nav>
        </header>
        {children}
        <footer className="world-footer">
          <p className="handwritten">
            a little place to return to, whenever you like ♡
          </p>
          <Link href="/">Back to our sky</Link>
        </footer>
        <CloudCompanion />
      </main>
    </WorldProvider>
  );
}
