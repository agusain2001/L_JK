"use client";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { motion, useReducedMotion, MotionConfig } from "motion/react";
import {
  ArrowRight,
  ArrowDown,
  Heart,
  Flower,
  Sun,
  EnvelopeSimple,
  ArrowUpRight,
  List,
  X,
} from "@phosphor-icons/react";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { loveStory } from "@/config/story";
import type { MemoryMedia } from "@/types/memory";
import { Polaroid } from "./Polaroid";
import FloatingMemories from "./FloatingMemories";
import { MemoryDialog, LetterDialog, Modal } from "./MemoryDialog";
import type { GameConfig } from "@/lib/games/schemas";
import { PlaygroundProvider } from "./games/GameProgress";
import GamesHub, { PlaygroundLink } from "./games/GamesHub";
import { HiddenHeartTrail } from "./games/HiddenHeartHunt";
import Link from "next/link";
import { MusicToggle, MusicCredit } from "./RomanticMusic";
import "@/app/world/world.css";
import ExperienceMotion from "./ExperienceMotion";
import LittleUniverse from "./LittleUniverse";
import AnimatedHeading from "./AnimatedHeading";
import { ReplayEntryButton } from "./entry/EntryExperience";
import TulipBloom from "./TulipBloom";
import SkyBackground from "./SkyBackground";

function Reveal({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={false}
      whileInView={reduce ? undefined : { opacity: [0.35, 1], y: [40, 0], rotateX: [6, 0] }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.8, ease: [0.2, 0.65, 0.25, 1] }}
    >
      {children}
    </motion.div>
  );
}
function Daisy({ className = "" }: { className?: string }) {
  return <TulipBloom className={`daisy ${className}`} />;
}
function LittleNote({
  note,
  index,
}: {
  note: (typeof loveStory.notes)[number];
  index: number;
}) {
  const [open, setOpen] = useState(false);
  const Icon =
    note.doodle === "sun" ? Sun : note.doodle === "flower" ? Flower : Heart;
  return (
    <button
      className={`little-note note-${index} ${open ? "note-open" : ""}`}
      onClick={() => setOpen(!open)}
      aria-expanded={open}
    >
      <span className="note-tape" aria-hidden="true" />
      <Icon size={30} weight="light" />
      <span className="handwritten note-title">{note.title} ♡</span>
      <span className="note-message">
        {open ? note.message : "Kholo na, tumhare liye likha hai."}
      </span>
      <span className="note-hint">
        {open ? "wapas fold karo" : "khol ke dekho"}
      </span>
    </button>
  );
}
export default function StoryExperience({
  memories,
  games,
  world,
}: {
  memories: MemoryMedia[];
  games: GameConfig;
  world: {
    enabled: boolean;
    daily: string | null;
    saveRewards: boolean;
    userId?: string;
  };
}) {
  const reduced = useReducedMotion();
  const [selected, setSelected] = useState<MemoryMedia | null>(null);
  const [letter, setLetter] = useState(false);
  const [surprise, setSurprise] = useState(false);
  const [garden, setGarden] = useState<number | null>(null);
  const [gameModal, setGameModal] = useState(false);
  const [filter, setFilter] = useState("All moments");
  const [menu, setMenu] = useState(false);
  const lenis = useRef<Lenis | null>(null);
  const root = useRef<HTMLDivElement>(null);
  const envelope = useRef<HTMLButtonElement>(null);
  const hero = memories.filter((m) => m.featured);
  const heroMemories = (hero.length ? hero : memories).slice(0, 6);
  const tags = [
    "All moments",
    ...new Set(memories.flatMap((m) => m.tags)),
    ...(memories.some((m) => m.kind === "video") ? ["Videos"] : []),
  ];
  const filtered = memories.filter(
    (m) =>
      filter === "All moments" ||
      (filter === "Videos" ? m.kind === "video" : m.tags.includes(filter)),
  );
  const timeline = memories.filter((m) => m.chapter === "timeline");
  const storyPhotos = (timeline.length ? timeline : memories).slice(0, 3);
  useEffect(() => {
    if (reduced) return;
    const smooth = new Lenis({
      duration: 1.3,
      smoothWheel: true,
      anchors: true,
      autoRaf: true,
    });
    lenis.current = smooth;
    gsap.registerPlugin(ScrollTrigger);
    smooth.on("scroll", ScrollTrigger.update);
    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>(".chapter").forEach((chapter) => {
        const art = chapter.querySelectorAll(".daisy, .cloud-wisp, .envelope-cloud, .notes-daisy, .ending-daisy");
        if (!art.length) return;
        gsap.fromTo(art, { y: 28, rotate: -6 }, {
          y: -28, rotate: 6, ease: "none",
          scrollTrigger: { trigger: chapter, start: "top bottom", end: "bottom top", scrub: 1.2 },
        });
      });
      gsap.fromTo(".envelope-scene", { rotateX: 12, y: 35 }, {
        rotateX: -5, y: -12, ease: "none",
        scrollTrigger: { trigger: "#letter", start: "top bottom", end: "bottom top", scrub: 1 },
      });
      gsap.fromTo(".notes-collection", { rotateX: 8 }, {
        rotateX: 0, ease: "none",
        scrollTrigger: { trigger: "#little-things", start: "top 90%", end: "center center", scrub: 1 },
      });
      gsap.to(".intro-note", {
        y: -45,
        rotate: -2,
        ease: "none",
        scrollTrigger: {
          trigger: "#story",
          start: "top bottom",
          end: "bottom top",
          scrub: 1,
        },
      });
      gsap.fromTo(
        ".timeline-line",
        { strokeDashoffset: 1200 },
        {
          strokeDashoffset: 0,
          ease: "none",
          scrollTrigger: {
            trigger: "#timeline",
            start: "top 75%",
            end: "bottom 60%",
            scrub: 1,
          },
        },
      );
      gsap.fromTo(
        ".garden-flowers",
        { scale: 0.7, y: 30 },
        {
          scale: 1,
          y: 0,
          ease: "none",
          scrollTrigger: {
            trigger: "#garden",
            start: "top 85%",
            end: "center 65%",
            scrub: 1,
          },
        },
      );
    }, root);
    return () => {
      ctx.revert();
      smooth.destroy();
      lenis.current = null;
    };
  }, [reduced]);
  useEffect(() => {
    if (selected || letter || surprise || garden !== null || gameModal)
      lenis.current?.stop();
    else lenis.current?.start();
  }, [selected, letter, surprise, garden, gameModal]);
  function moveMemory(direction: number) {
    if (!selected) return;
    const index = memories.findIndex((m) => m.id === selected.id);
    setSelected(
      memories[(index + direction + memories.length) % memories.length],
    );
  }
  function openLetter() {
    if (reduced) {
      setLetter(true);
      return;
    }
    if (envelope.current) {
      envelope.current.classList.add("envelope-opening");
      setTimeout(() => {
        setLetter(true);
        envelope.current?.classList.remove("envelope-opening");
      }, 650);
    } else setLetter(true);
  }
  return (
    <PlaygroundProvider
      config={games}
      onDialogChange={setGameModal}
      saveRewards={world.saveRewards}
      userId={world.userId}
    >
      <MotionConfig reducedMotion="user">
        <div ref={root} className="story-experience">
          <ExperienceMotion root={root} />
          <a className="skip-link" href="#main">
            Seedha page pe
          </a>
          <header className="site-header">
            <a href="#home" className="wordmark" aria-label="For you, home">
              for you <span>♡</span>
            </a>
            <nav
              id="story-navigation"
              aria-label="Main navigation"
              className={menu ? "nav-open" : ""}
            >
              {[
                ["Shuruat", "home"],
                ["Yaadein", "memories"],
                ["Message", "letter"],
                ["Photos", "gallery"],
                ["Thodi masti ♡", "games"],
              ].map(([label, id]) => (
                <a key={id} href={`#${id}`} onClick={() => setMenu(false)}>
                  {label}
                </a>
              ))}
              {world.enabled && (
                <Link href="/world" onClick={() => setMenu(false)}>
                  Hamari duniya
                </Link>
              )}
            </nav>
            <a href="#story" className="header-story">
              Dekho na <Heart size={16} weight="light" />
            </a>
            <button
              className="menu-button icon-button"
              aria-label={menu ? "Close menu" : "Open menu"}
              aria-expanded={menu}
              aria-controls="story-navigation"
              onClick={() => setMenu(!menu)}
            >
              {menu ? <X size={23} /> : <List size={23} />}
            </button>
          </header>
          <main id="main">
            <section id="home" className="hero">
              <SkyBackground />
              <div className="hero-cloud cloud-one" />
              <div className="hero-cloud cloud-two" />
              <div className="hero-copy">
                <motion.div
                  initial={false}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 1 }}
                >
                  <span className="eyebrow">
                    <span className="tiny-line" /> Ek chhoti si jagah, sirf{" "}
                    {loveStory.girlfriendName ? `${loveStory.girlfriendName} ke liye` : "tumhare liye"}
                  </span>
                  <AnimatedHeading as="h1">
                    <span>{loveStory.hero.lines.opening}</span>
                    <span>
                      {loveStory.hero.lines.lead}{" "}
                      <em>{loveStory.hero.lines.emphasis}</em>
                    </span>
                    <span>
                      <em>{loveStory.hero.lines.ending}</em>
                      <span className="headline-heart">♡</span>
                    </span>
                  </AnimatedHeading>
                  <p>{loveStory.hero.description}</p>
                  <div className="hero-actions">
                    <a className="button primary" href="#story">
                      Chalo, dekho <ArrowRight size={19} />
                    </a>
                    <a className="button secondary" href="#memories">
                      Photos dekho
                    </a>
                  </div>
                </motion.div>
              </div>
              <div className="hero-art">
                <FloatingMemories
                  memories={heroMemories}
                  onOpen={setSelected}
                  reduced={!!reduced}
                />
                <span className="hero-annotation handwritten">
                  yahan apni photos lagayenge <span>↗</span>
                </span>
                <Daisy className="hero-daisy" />
                <span className="floating-heart heart-one">♡</span>
                <span className="floating-heart heart-two">♡</span>
              </div>
              <a className="scroll-prompt" href="#story">
                <ArrowDown size={16} /> Neeche bhi dekho na
              </a>
              <span className="hero-bottom-note handwritten">
                flowers bhi hain, games bhi... aaram se dekho
              </span>
            </section>
            <section id="story" className="intro chapter">
              <Reveal>
                <span className="handwritten">
                  Din normal hi hota hai...
                </span>
                <AnimatedHeading>
                  tumse baat ho jaaye toh <em>achha lagta hai.</em>
                </AnimatedHeading>
                <div className="intro-note">
                  <span className="note-tape" />
                  <span className="handwritten">Phir tum aa gayi.</span>
                  <Heart weight="light" size={25} />
                  <p>Phir boring din bhi itna boring nahi lagta.</p>
                </div>
              </Reveal>
              <div className="cloud-wisp" />
            </section>
            <LittleUniverse memories={heroMemories} onOpen={setSelected} />
            <section id="memories" className="memories chapter">
              <Reveal className="section-heading">
                <span className="handwritten">saath wali photos ke liye</span>
                <AnimatedHeading>
                  Yeh moments na...
                  <br /><em>Baar baar dekhne hain.</em>
                </AnimatedHeading>
                <p>
                  Abhi sample photos hain. Yahan apni wali aayengi, phir dekhna.
                </p>
              </Reveal>
              <div className="memory-orbit">
                <FloatingMemories
                  variant="memories"
                  memories={memories.slice(0, 5)}
                  onOpen={setSelected}
                  reduced={!!reduced}
                />
                <span className="handwritten orbit-note">
                  bas aise hi,
                  <br />
                  saath mein ♡
                </span>
              </div>
              <a href="#gallery" className="text-button">
                Saari photos dekho <ArrowUpRight size={18} />
              </a>
            </section>
            <section id="little-things" className="little-things chapter">
              <Reveal className="section-heading">
                <AnimatedHeading>
                  Tumhari kuch baatein...
                  <br />
                  <em>Jo mujhe achhi lagti hain.</em>
                </AnimatedHeading>
                <p>
                  Haan, likh ke rakhi hain. Ab tum bologi toh nahi ki tareef nahi karta.
                </p>
              </Reveal>
              <div className="notes-collection">
                {loveStory.notes.map((note, i) => (
                  <Reveal key={note.title}>
                    <LittleNote note={note} index={i} />
                  </Reveal>
                ))}
                <Daisy className="notes-daisy" />
              </div>
              <span className="handwritten chapter-footnote">
                ek kholo... haan, tumhare baare mein hi hai
              </span>
            </section>
            <section id="timeline" className="timeline chapter">
              <Reveal className="section-heading">
                <span className="handwritten">yeh sab yaad rakhna hai</span>
                <AnimatedHeading>
                  Kuch photos,
                  <br />
                  <em>kuch apni baatein.</em>
                </AnimatedHeading>
                <p>Har cheez ki photo nahi hoti na. Kuch baatein aise hi yaad reh jaati hain.</p>
              </Reveal>
              <div className="timeline-trail">
                <svg
                  className="timeline-svg"
                  viewBox="0 0 1100 320"
                  aria-hidden="true"
                >
                  <path
                    className="timeline-line"
                    d="M20 180 C180 30 300 320 460 160 S740 0 1080 190"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeDasharray="1200"
                  />
                </svg>
                {storyPhotos.map((m, i) => (
                  <Reveal key={m.id} className={`timeline-entry timeline-${i}`}>
                    <span className="timeline-label handwritten">
                      {m.date || "yeh moment yaad rahega"}
                    </span>
                    <Polaroid memory={m} onOpen={() => setSelected(m)} />
                    <p>
                      {m.demo ? "Yahan baad mein apni photo lagayenge." : m.description}
                    </p>
                  </Reveal>
                ))}
              </div>
            </section>
            <section id="garden" className="garden chapter">
              <Reveal className="garden-copy">
                <span className="handwritten">
                  achha, yeh flowers bhi tumhare
                </span>
                <AnimatedHeading>
                  Ek aur tulip?
                  <br />
                  <em>Tumhare liye hi toh hain.</em>
                </AnimatedHeading>
                <p>Har flower pe ek baat likhi hai. Touch karke dekho.</p>
                <span className="handwritten">
                  ek choose karo, kuch kehna hai ♡
                </span>
              </Reveal>
              <div className="garden-flowers">
                {loveStory.garden.map((_, i) => (
                  <button
                    key={i}
                    className={`garden-flower flower-${i}`}
                    onClick={() => setGarden(i)}
                    aria-label={`Pick flower ${i + 1}`}
                  >
                    <TulipBloom color={["#e3a0aa", "#f0d6a2", "#c7a7d4"][i % 3]} />
                    <span className="flower-stem" />
                    <span className="flower-leaf" />
                  </button>
                ))}
                <div className="garden-cloud" />
              </div>
              <PlaygroundLink game="bouquet">
                Apna bouquet banao
              </PlaygroundLink>
            </section>
            <section id="letter" className="letter chapter">
              <Reveal className="section-heading">
                <span className="handwritten">ek message bhi likha hai</span>
                <AnimatedHeading>
                  Tumse kuch kehna tha.
                  <br />
                  <em>Toh yahan likh diya.</em>
                </AnimatedHeading>
                <p>Lamba speech nahi hai, promise. Bas padho na.</p>
              </Reveal>
              <div className="envelope-scene">
                <button
                  ref={envelope}
                  className="envelope"
                  aria-label="Open your letter — for my favourite person"
                  onClick={openLetter}
                >
                  <span className="envelope-shell">
                    <span className="letter-peek" />
                    <span className="envelope-back" />
                    <span className="envelope-flap" />
                    <span className="envelope-front" />
                    <span className="envelope-seal">
                      <Heart size={20} weight="light" />
                    </span>
                    <span className="envelope-address handwritten">
                      {loveStory.girlfriendName} ke naam
                    </span>
                  </span>
                </button>
                <Daisy className="envelope-daisy" />
                <span className="envelope-cloud" />
              </div>
              <button
                className="text-button handwritten letter-open"
                onClick={openLetter}
              >
                Message padho ♡ <ArrowUpRight size={19} />
              </button>
            </section>
            <section id="gallery" className="gallery chapter">
              <Reveal className="section-heading">
                <AnimatedHeading>
                  Kuch photos baar baar
                  <br />
                  <em>dekhne ka mann hota hai.</em>
                </AnimatedHeading>
                <p>Jab mann kare, yahan aa ke photos dekh lena.</p>
              </Reveal>
              <div className="gallery-filters" aria-label="Filter memories">
                {tags.map((tag) => (
                  <button
                    key={tag}
                    className={filter === tag ? "active" : ""}
                    aria-pressed={filter === tag}
                    onClick={() => setFilter(tag)}
                  >
                    {tag === "All moments" ? "Saari yaadein" : tag === "little things" ? "Chhoti cheezein" : tag === "outdoors" ? "Bahar wali" : tag}
                  </button>
                ))}
              </div>
              <div className="gallery-grid">
                {filtered.map((m, i) => (
                  <Polaroid
                    key={m.id}
                    memory={m}
                    onOpen={() => setSelected(m)}
                    style={
                      {
                        "--rotation": `${((i % 3) - 1) * 3}deg`,
                      } as CSSProperties
                    }
                  />
                ))}
              </div>
              {!filtered.length && (
                <p className="empty-state">
                  Yahan abhi koi photo nahi hai. Baad mein add kar lenge.
                </p>
              )}
              {memories.every((m) => m.demo) && (
                <p className="demo-disclosure">
                  Abhi sample photos hain. Apni wali bhi yahin lagayenge.
                </p>
              )}
              {games.puzzles.length > 0 && (
                <PlaygroundLink game="guess" puzzleId={games.puzzles[0].id}>
                  Ek photo pehchaan ke dikhao
                </PlaygroundLink>
              )}
            </section>
            <GamesHub memories={memories} />
            {world.enabled && (
              <section className="home-world chapter" id="little-world">
                <Reveal className="section-heading">
                  <span className="handwritten">
                    thoda aur time saath mein
                  </span>
                  <AnimatedHeading>
                    Apni chhoti si <em>duniya.</em>
                  </AnimatedHeading>
                  <p>
                    Messages, photos aur apne plans... sab ek jagah. Jab mann ho, aa jaana.
                  </p>
                </Reveal>
                <div className="home-world-links">
                  <Link href="/world/letters">
                    <EnvelopeSimple size={36} weight="light" />
                    <h3>Jab mood off ho...</h3>
                    <p>Tab ke liye bhi ek message hai.</p>
                  </Link>
                  <Link href="/world/today">
                    <Sun size={36} weight="light" />
                    <h3>Aaj tumhare liye</h3>
                    <p>{world.daily || "Aaj bhi tum meri favourite ho."}</p>
                  </Link>
                  <Link href="/world/garden">
                    <Flower size={36} weight="light" />
                    <h3>Apni photos ka garden</h3>
                    <p>Ek nayi photo, ek naya flower.</p>
                  </Link>
                </div>
                <Link className="button primary" href="/world">
                  Andar bhi dekho <ArrowRight size={19} />
                </Link>
              </section>
            )}
            <section id="ending" className="ending chapter">
              <SkyBackground ending />
              <Reveal>
                <span className="handwritten">
                  achha, abhi jaana mat
                </span>
                <AnimatedHeading>
                  Aur walks,
                  <br />
                  aur baatein,
                  <br />
                  <em>bas saath mein.</em>
                </AnimatedHeading>
                <p>
                  Kal ka plan pata nahi.
                  <br />
                  Tum saath ho toh plan bana hi lenge.
                </p>
                <span className="handwritten final-message">
                  {loveStory.finalMessage}
                </span>
                <div className="ending-actions">
                  <a className="button secondary" href="#home">
                    Phir se dekho <ArrowRight size={18} />
                  </a>
                  <button
                    className="button primary"
                    onClick={() => setSurprise(true)}
                  >
                    Ek aur chhota surprise <Heart size={18} />
                  </button>
                </div>
              </Reveal>
              <Daisy className="ending-daisy" />
            </section>
          </main>
          <footer className="site-footer">
            <a className="wordmark" href="#home">
              for you <span>♡</span>
            </a>
            <p>{loveStory.girlfriendName}, tumhare liye banaya. Achha laga na?</p>
            <ReplayEntryButton />
            <a
              href="/admin"
              aria-label="Made with love — personalize this little sky"
            >
              Dil se banaya <Heart size={13} weight="light" />
            </a>
            <MusicCredit />
          </footer>
          <MusicToggle />
          <HiddenHeartTrail />
          {selected && (
            <MemoryDialog
              memory={selected}
              onClose={() => setSelected(null)}
              onNext={() => moveMemory(1)}
              onPrevious={() => moveMemory(-1)}
            />
          )}
          {letter && <LetterDialog onClose={() => setLetter(false)} />}
          {garden !== null && (
            <Modal
              label="A thought from the garden"
              onClose={() => setGarden(null)}
              className="thought-dialog"
            >
              <Daisy />
              <span className="handwritten">yeh bhi tumhare liye</span>
              <AnimatedHeading>{loveStory.garden[garden]}</AnimatedHeading>
              <Heart size={28} weight="light" />
            </Modal>
          )}
          {surprise && (
            <Modal
              label="One more little surprise"
              onClose={() => setSurprise(false)}
              className="thought-dialog surprise-dialog"
            >
              <EnvelopeSimple size={38} weight="light" />
              <span className="handwritten">Achha, ek last baat...</span>
              <motion.h2
                initial={reduced ? false : { opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: reduced ? 0 : 0.8, duration: 0.8 }}
              >
                {loveStory.surprise}
              </motion.h2>
              <Daisy />
            </Modal>
          )}
        </div>
      </MotionConfig>
    </PlaygroundProvider>
  );
}
