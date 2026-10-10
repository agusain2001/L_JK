"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode, type CSSProperties } from "react";
import { AnimatePresence, motion, useIsPresent, useReducedMotion } from "motion/react";
import { ArrowLeft, ArrowRight, Heart, Butterfly, Flower } from "@phosphor-icons/react";
import GardenMotion from "./GardenMotion";
import AnimatedHeading from "../AnimatedHeading";
import { tulipChoices } from "@/config/entry";
import { loveStory } from "@/config/story";
import { MusicToggle, MusicCredit, useRomanticMusic } from "../RomanticMusic";

export const ENTRY_SESSION_KEY = "for-you:tulip-walk:v3";
const chapters = ["Thoda ghoom lein", "Tumhara tulip", "Ek baat suno"];

function GardenArrival({ onOpen }: { onOpen: () => void }) {
  const [stage, setStage] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [walking, setWalking] = useState(false);
  const { startWalk } = useRomanticMusic();
  const lock = useRef(false);
  const title = useRef<HTMLDivElement>(null);
  const screen = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();
  const present = useIsPresent();
  useEffect(() => {
    title.current?.querySelector<HTMLElement>("h1")?.focus({ preventScroll: true });
    screen.current?.scrollTo({ top: 0, behavior: "instant" });
  }, [stage]);
  useEffect(() => {
    if (!walking) return;
    let active = true;
    let assetTimer: ReturnType<typeof setTimeout>;
    let animationTimer: ReturnType<typeof setTimeout>;
    const sky = new Image();
    const ready = stage === 2 ? new Promise<void>((resolve) => {
      sky.onload = sky.onerror = () => resolve();
      assetTimer = setTimeout(resolve, 2500);
      sky.src = "/images/sky-gemini.webp";
      if (sky.complete) resolve();
    }) : Promise.resolve();
    const travel = new Promise<void>((resolve) => { animationTimer = setTimeout(resolve, reduced ? 60 : stage === 2 ? 1600 : 1100); });
    void Promise.all([ready, travel]).then(() => {
      if (!active) return;
      if (stage === 2) onOpen();
      else { setStage(stage + 1); setWalking(false); lock.current = false; }
    });
    return () => { active = false; clearTimeout(assetTimer); clearTimeout(animationTimer); sky.onload = sky.onerror = null; };
  }, [walking, stage, onOpen, reduced]);
  const next = () => {
    if (lock.current || (stage === 1 && selected === null)) return;
    if (stage === 0) startWalk();
    lock.current = true;
    setWalking(true);
  };
  return <motion.section ref={screen} className={`entry-screen tulip-arrival garden-stage-${stage} ${walking ? "garden-walking" : ""}`} data-stage={stage} aria-label="Princess ki tulip walk" aria-hidden={!present} inert={!present} data-lenis-prevent exit={{ opacity: 0 }} transition={{ duration: reduced ? 0 : 0.7 }}>
    <div className="tulip-environment" aria-hidden="true"><div className="tulip-landscape"><GardenMotion /></div><div className="tulip-daylight" /><div className="tulip-sunbeam" /></div>
    <div className="garden-pollen" aria-hidden="true">{Array.from({ length: 18 }, (_, i) => <i key={i} style={{ "--pollen-x": `${(i * 37 + 9) % 100}%`, "--pollen-y": `${(i * 29 + 15) % 100}%`, "--pollen-delay": `${-i}s` } as CSSProperties} />)}</div>
    <header className="garden-entry-header"><span className="wordmark">for you <Heart size={17} weight="light" aria-hidden="true" /></span><span className="handwritten">{loveStory.girlfriendName} ke liye banaya hai ♡</span><MusicToggle entry /></header>
    <div className="garden-entry-body">
      <div className="garden-entry-copy" ref={title}>
        <span className="garden-entry-kicker handwritten">{stage === 0 ? "aaj princess ko thoda pamper karein?" : stage === 1 ? "achha, ab apna favourite choose karo" : "achha, ek baat bolun?"}</span>
        <div key={stage} className="garden-copy-chapter">
          <AnimatedHeading as="h1">{stage === 0 ? <>Chalo, {loveStory.girlfriendName}.<br /><em>Thoda ghoom ke aate hain.</em></> : stage === 1 ? <>Kaunsa tulip chahiye?<br /><em>Ek lo, ya saare rakh lo.</em></> : <>Achha, sach bolun?<br /><em>Bas tumhe khush karna tha.</em></>}</AnimatedHeading>
          <p className="garden-entry-description">{stage === 0 ? "Tumhe tulips pasand hain na? Dekho, tumhare liye poora garden hai. Chalo, saath mein thoda ghoomte hain." : stage === 1 ? "Pink, cream ya lilac? Jo pasand aaye le lo. Aur ek hi choose karna zaroori nahi... baaki bhi tumhare hain." : "Socha tumhare favourite flowers se start karun. But abhi toh aur bhi hai. Pehle ek baat sun lo..."}</p>
          {stage === 1 && <fieldset className="garden-tulip-picker" disabled={walking}><legend>Kaunsa pasand aaya?</legend><div className="garden-tulip-options">{tulipChoices.map((flower, i) => <button type="button" key={flower.label} className={selected === i ? "selected" : ""} aria-pressed={selected === i} onClick={() => setSelected(i)}><span style={{ background: flower.color }} /><span>{flower.label}</span>{selected === i && <Heart size={12} weight="fill" aria-hidden="true" />}</button>)}</div></fieldset>}
          {stage === 2 && <div className="garden-love-note"><span className="garden-note-pin" aria-hidden="true" /><Heart size={18} weight="light" aria-hidden="true" /><p className="handwritten">Flowers achhe hain, but tumhari smile...<br />Haan, woh zyada achhi lagti hai.</p><span>sirf tumhare liye ♡</span></div>}
          <div className="garden-entry-reply handwritten" aria-live="polite" aria-atomic="true">{walking ? stage === 2 ? "Bas ek second... surprise ready hai." : "Chalo, aage dekhte hain..." : stage === 0 ? "Haath do na. Saath mein chalte hain." : stage === 1 ? selected === null ? "Batao, kaunsa doon tumhe?" : tulipChoices[selected].quote : "Ab aage ka surprise dekhein?"}</div>
          <button type="button" className="garden-entry-next" onClick={next} disabled={walking || (stage === 1 && selected === null)}><span>{walking ? "Chal rahe hain..." : stage === 0 ? "Haan, chalo" : stage === 1 ? "Yeh wala, ab aage chalo" : "Ab surprise dikhao"}</span><ArrowRight size={19} aria-hidden="true" /></button>
          <div className="garden-entry-under">{stage > 0 ? <button type="button" className="garden-entry-back" disabled={walking} onClick={() => setStage(stage - 1)}><ArrowLeft size={13} aria-hidden="true" /> Wapas chalein?</button> : <span>Music bhi hai. Mann ho toh on rehne dena.</span>}</div>
        </div>
      </div>
      <div className="garden-scene-whisper handwritten" aria-hidden="true"><Butterfly size={23} weight="light" /><span>{stage === 0 ? "Flowers dekhna... mujhe ignore mat kar dena." : stage === 1 ? "Achha choice hai. Waise tumhe saare de deta." : "Princess ke liye itna toh banta hai."}</span></div>
    </div>
    <footer className="garden-entry-footer"><ol aria-label="Garden ki sair">{chapters.map((chapter, i) => <li key={chapter} aria-current={i === stage ? "step" : undefined} className={i <= stage ? "reached" : ""}><span>{i < stage ? <Flower size={14} weight="fill" aria-hidden="true" /> : <i />}</span><span>{chapter}</span></li>)}</ol><span className="handwritten">bas tumhe achha lage ♡</span><MusicCredit /></footer>
    {stage === 2 && walking && <motion.div className="garden-final-light" aria-hidden="true" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: reduced ? 0 : 1.5, delay: reduced ? 0 : 0.25 }}><Butterfly size={36} weight="light" /><span className="handwritten">{loveStory.girlfriendName}, ab asli surprise dekho.</span></motion.div>}
  </motion.section>;
}

export default function EntryExperience({ children }: { children: ReactNode }) {
  const [entered, setEntered] = useState(false);
  const [restored, setRestored] = useState(false);
  const manuallyOpened = useRef(false);
  const open = useCallback(() => {
    try { sessionStorage.setItem(ENTRY_SESSION_KEY, "1"); } catch { /* Storage is optional. */ }
    manuallyOpened.current = true; setEntered(true);
  }, []);
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      try { if (sessionStorage.getItem(ENTRY_SESSION_KEY) === "1") { setRestored(true); setEntered(true); } } catch { /* Show the garden. */ }
    });
    const replay = () => {
      try { sessionStorage.removeItem(ENTRY_SESSION_KEY); } catch { /* Replay needs no storage. */ }
      manuallyOpened.current = false; setRestored(false); setEntered(false);
    };
    window.addEventListener("for-you:replay-entry", replay);
    return () => { cancelAnimationFrame(frame); window.removeEventListener("for-you:replay-entry", replay); };
  }, []);
  const reveal = () => {
    if (!manuallyOpened.current) return;
    document.querySelector<HTMLElement>("#home h1")?.focus({ preventScroll: true });
    const anchor = document.getElementById(location.hash.slice(1));
    if (anchor) anchor.scrollIntoView({ behavior: "instant" });
    else window.scrollTo({ top: 0, behavior: "instant" });
  };
  return <>{entered && children}{!restored && <AnimatePresence initial={false} onExitComplete={reveal}>{!entered && <GardenArrival key="garden" onOpen={open} />}</AnimatePresence>}</>;
}

export function ReplayEntryButton() {
  return <button className="entry-replay text-button" onClick={() => window.dispatchEvent(new Event("for-you:replay-entry"))}>Garden mein phir chalein? <Flower size={16} aria-hidden="true" /></button>;
}
