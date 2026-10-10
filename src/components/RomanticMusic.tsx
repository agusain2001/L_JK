"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { MusicNote, SpeakerSlash } from "@phosphor-icons/react";
import { loveStory } from "@/config/story";
import { claimAudio } from "@/lib/world/audio";

const MUSIC_OWNER = "romantic-piano";
const MusicContext = createContext<{
  playing: boolean;
  starting: boolean;
  startWalk: () => void;
  toggle: () => void;
} | null>(null);

export function RomanticMusicProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const wanted = useRef(false);
  const choiceMade = useRef(false);
  const fade = useRef(0);
  const request = useRef({ version: 0 });
  const [playing, setPlaying] = useState(false);
  const [starting, setStarting] = useState(false);
  const [message, setMessage] = useState("");

  const stop = useCallback(() => {
    wanted.current = false;
    request.current.version++;
    cancelAnimationFrame(fade.current);
    audioRef.current?.pause();
    setStarting(false);
    setPlaying(false);
  }, []);

  const start = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || wanted.current) return;
    wanted.current = true;
    const attempt = ++request.current.version;
    setStarting(true);
    setMessage("");
    if (!audio.getAttribute("src") || audio.error) {
      audio.src = loveStory.soundtrack;
      audio.load();
    }
    audio.volume = 0;
    claimAudio(MUSIC_OWNER);
    void audio.play().then(() => {
      if (attempt !== request.current.version) return;
      if (!wanted.current || document.hidden) { stop(); return; }
      setPlaying(true);
      setStarting(false);
      const began = performance.now();
      const soften = (now: number) => {
        if (!wanted.current) return;
        const progress = Math.min(1, (now - began) / 1200);
        audio.volume = .24 * progress * progress * (3 - 2 * progress);
        if (progress < 1) fade.current = requestAnimationFrame(soften);
      };
      fade.current = requestAnimationFrame(soften);
    }).catch(() => {
      if (attempt !== request.current.version) return;
      if (!wanted.current) return;
      stop();
      setMessage("Music play nahi hua. Button se phir try kar lo.");
    });
  }, [stop]);

  const startWalk = useCallback(() => {
    if (choiceMade.current) return;
    choiceMade.current = true;
    start();
  }, [start]);

  const toggle = useCallback(() => {
    choiceMade.current = true;
    if (wanted.current) stop(); else start();
  }, [start, stop]);

  useEffect(() => {
    const audio = audioRef.current;
    const requests = request.current;
    const other = (event: Event) => {
      if ((event as CustomEvent).detail !== MUSIC_OWNER) stop();
    };
    const hidden = () => { if (document.hidden) stop(); };
    window.addEventListener("for-you:audio", other);
    document.addEventListener("visibilitychange", hidden);
    return () => {
      wanted.current = false;
      requests.version++;
      cancelAnimationFrame(fade.current);
      audio?.pause();
      audio?.removeAttribute("src");
      audio?.load();
      window.removeEventListener("for-you:audio", other);
      document.removeEventListener("visibilitychange", hidden);
    };
  }, [stop]);

  return <MusicContext.Provider value={{ playing, starting, startWalk, toggle }}>
    {children}
    <audio ref={audioRef} className="romantic-soundtrack" preload="none" loop aria-hidden="true" onError={() => {
      if (wanted.current) {
        stop();
        setMessage("Music load nahi hua. Koi na, aage chalte hain.");
      }
    }} />
    <span role="status" className="sr-only">{message}</span>
  </MusicContext.Provider>;
}

export function useRomanticMusic() {
  const music = useContext(MusicContext);
  if (!music) throw new Error("Romantic music requires its provider.");
  return music;
}

export function MusicToggle({ entry = false }: { entry?: boolean }) {
  const { playing, starting, toggle } = useRomanticMusic();
  const active = playing || starting;
  return <button type="button" className={entry ? "garden-music-toggle" : "sound-toggle"} onClick={toggle}
    aria-pressed={active} aria-label={active ? "Turn sound off — music on" : "Turn sound on — music off"}>
    {active ? <MusicNote size={17} aria-hidden="true" /> : <SpeakerSlash size={17} aria-hidden="true" />}
    <span>{starting ? "Bas ek pal..." : playing ? "Music rok do" : "Music chalao"}</span>
  </button>;
}

export function MusicCredit() {
  const credit = loveStory.soundtrackCredit;
  return <small className="music-credit">Music: <a href={credit.source} target="_blank" rel="noreferrer">{credit.title} — {credit.artist}</a> · <a href={credit.licenseUrl} target="_blank" rel="noreferrer">{credit.license}</a></small>;
}
