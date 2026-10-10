"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "motion/react";
import { Heart, Sparkle, Flower } from "@phosphor-icons/react";
import type { MemoryMedia } from "@/types/memory";
import { Polaroid } from "./Polaroid";
import AnimatedHeading from "./AnimatedHeading";

export default function LittleUniverse({ memories, onOpen }: { memories: MemoryMedia[]; onOpen: (memory: MemoryMedia) => void }) {
  const section = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: section, offset: ["start end", "end start"] });
  const islandY = useTransform(scrollYProgress, [0, 1], [65, -65]);
  const islandRotate = useTransform(scrollYProgress, [0, 1], [-8, 8]);
  const orbitRotate = useTransform(scrollYProgress, [0, 1], [-22, 22]);
  const leftY = useTransform(scrollYProgress, [0, 1], [90, -100]);
  const rightY = useTransform(scrollYProgress, [0, 1], [-40, 70]);
  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [0.86, 1.05, 0.95]);
  return (
    <section className="little-universe chapter" ref={section} aria-labelledby="universe-title">
      <div className="universe-stage">
        <div className="section-heading universe-copy">
          <span className="handwritten">bas aisi hi ek jagah chahiye</span>
          <AnimatedHeading id="universe-title">Flowers, photos, aur tum.<br /><em>Aur kya chahiye?</em></AnimatedHeading>
          <p>Tum baitho, main sunta hoon. Baaki plans baad mein bana lenge.</p>
        </div>
        <div className="universe-art">
          <motion.div className="universe-orbit" aria-hidden="true" style={{ rotate: orbitRotate }}><i /><i /><i /></motion.div>
          <motion.div className="universe-island" style={{ y: islandY, rotate: islandRotate, scale }}>
            <img src="/images/little-universe.webp" width="1200" height="800" loading="lazy" alt="A miniature garden of daisies and a love letter, floating on a soft cloud" />
          </motion.div>
          {memories.slice(0, 2).map((memory, index) => (
            <motion.div key={memory.id} className={`universe-memory universe-memory-${index}`} style={{ y: index ? rightY : leftY }}>
              <Polaroid memory={memory} onOpen={() => onOpen(memory)} />
            </motion.div>
          ))}
          <span className="universe-spark spark-a" aria-hidden="true"><Sparkle weight="light" /></span>
          <span className="universe-spark spark-b" aria-hidden="true"><Heart weight="light" /></span>
          <span className="universe-spark spark-c" aria-hidden="true"><Flower weight="light" /></span>
        </div>
        <span className="universe-caption handwritten">thodi der aur ruk jao na ♡</span>
      </div>
    </section>
  );
}
