"use client";
import dynamic from "next/dynamic";
import Link from "next/link";
import { motion } from "motion/react";
import AnimatedHeading from "../AnimatedHeading";
import type { FeatureId } from "@/lib/world/schemas";
import { features } from "@/lib/world/features";
import { useWorld } from "./WorldContext";
const loading = () => (
  <p className="world-loading" role="status">
    Unfolding a little surprise…
  </p>
);
const Letters = dynamic(() => import("./Letters"), { loading }),
  Capsules = dynamic(() => import("./Capsules"), { loading }),
  Daily = dynamic(() => import("./DailyNote"), { loading }),
  Mood = dynamic(() => import("./MoodSurprises"), { loading }),
  Music = dynamic(() => import("./MusicCorner"), { loading }),
  Dates = dynamic(() => import("./SpecialDates"), { loading }),
  Map = dynamic(() => import("./MemoryMap"), { loading }),
  Surprise = dynamic(() => import("./SurpriseMemory"), { loading }),
  Garden = dynamic(() => import("./GrowingGarden"), { loading }),
  Bucket = dynamic(() => import("./BucketList"), { loading }),
  Notes = dynamic(() => import("./PrivateNotes"), { loading }),
  Booth = dynamic(() => import("./PhotoBooth"), { loading }),
  Keepsakes = dynamic(() => import("./KeepsakeDrawer"), { loading });
export default function WorldExperience({ id }: { id: FeatureId }) {
  const { data, ready } = useWorld();
  const feature = features.find((feature) => feature.id === id)!;
  return (
    <section className={`world-feature feature-${id}`} data-world-ready={ready}>
      <Link className="world-back text-button" href="/world">
        ← Back to our little world
      </Link>
      <div className="world-feature-heading">
        <span className="handwritten">a little discovery ♡</span>
        <AnimatedHeading as="h1">{feature.title}</AnimatedHeading>
        <p>{feature.description}</p>
      </div>
      {data.flags[id] === false ||
      (!data.actor && !data.settings.guestAccess) ? (
        <p>
          This little corner is resting or requires your invitation.{" "}
          <Link href="/world/access">Your private access</Link>
        </p>
      ) : (
        <motion.div
          className="world-feature-body"
          key={id}
          initial={false}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {id === "letters" ? (
            <Letters />
          ) : id === "capsules" ? (
            <Capsules />
          ) : id === "today" ? (
            <Daily />
          ) : id === "mood" ? (
            <Mood />
          ) : id === "voice" ? (
            <Music voice />
          ) : id === "music" ? (
            <Music />
          ) : id === "dates" ? (
            <Dates />
          ) : id === "map" ? (
            <Map />
          ) : id === "surprise" ? (
            <Surprise />
          ) : id === "garden" ? (
            <Garden />
          ) : id === "bucket-list" ? (
            <Bucket />
          ) : id === "notes" ? (
            <Notes />
          ) : id === "photo-booth" ? (
            <Booth />
          ) : id === "keepsakes" ? (
            <Keepsakes />
          ) : (
            <div className="unfolded-paper companion-introduction">
              <h2>A small cloud, with a little curiosity.</h2>
              <p>
                Your cloud lives in its own quiet corner beneath the page. Tap
                its face for a hint, let it rest whenever you like, and wake it
                again when you want company.
              </p>
              <p>
                It never floats over the photographs or the words you&apos;re
                reading.
              </p>
              <Link href="/#games">Find a surprise in Little Games</Link>
            </div>
          )}
        </motion.div>
      )}
    </section>
  );
}
