"use client";
import Link from "next/link";
import {
  EnvelopeSimple,
  Microphone,
  Gift,
  Note,
  MapTrifold,
  Camera,
  Cloud,
  CassetteTape,
  Notebook,
  CalendarHeart,
  ChatTeardropText,
  Heart,
  Flower,
  Images,
  TreasureChest,
  ArrowRight,
} from "@phosphor-icons/react";
import type { Icon } from "@phosphor-icons/react";
import { features } from "@/lib/world/features";
import { useWorld } from "./WorldContext";
import AnimatedHeading from "../AnimatedHeading";
const icons: Icon[] = [
  EnvelopeSimple,
  Microphone,
  Note,
  Heart,
  ChatTeardropText,
  MapTrifold,
  CalendarHeart,
  Gift,
  Notebook,
  CassetteTape,
  Camera,
  Cloud,
  Flower,
  Images,
  TreasureChest,
];
export default function WorldHub() {
  const { data } = useWorld();
  return (
    <>
      <section className="world-intro">
        <span className="handwritten">our little world ♡</span>
        <AnimatedHeading as="h1">
          A little world,
          <br />
          <em>made just for you.</em>
        </AnimatedHeading>
        <p>
          Letters to open, memories to revisit, little surprises to find, and
          beautiful moments still waiting to happen.
        </p>
        <div className="world-hub-art" aria-hidden="true">
          <span className="world-hub-orbit" />
          <img src="/images/little-universe.webp" width="1200" height="800" alt="" loading="lazy" />
        </div>
        {data.daily && (
          <Link href="/world/today" className="today-preview">
            <Note size={23} weight="light" />
            <span>A little note is waiting for today.</span>
            <ArrowRight size={20} />
          </Link>
        )}
        {!data.actor && !data.settings.guestAccess && (
          <p>
            Bring your invitation to open this little world.{" "}
            <Link href="/world/access">Sign in</Link>
          </p>
        )}
      </section>
      {[...new Set(features.map((feature) => feature.group))].map(
        (group, groupIndex) => (
          <section className="world-discovery" key={group}>
            <div className="world-group-heading">
              <span>0{groupIndex + 1}</span>
              <AnimatedHeading>{group}</AnimatedHeading>
            </div>
            <div className="world-shelf">
              {features.map((feature, index) => {
                if (feature.group !== group || data.flags[feature.id] === false)
                  return null;
                const Icon = icons[index];
                return (
                  <Link
                    href={`/world/${feature.id}`}
                    className={`world-object world-object-${index % 4}`}
                    key={feature.id}
                  >
                    <div className="world-object-art">
                      <Icon size={64} weight="light" />
                      <span>♡</span>
                    </div>
                    <AnimatedHeading as="h3">{feature.title}</AnimatedHeading>
                    <p>{feature.description}</p>
                    <span className="world-object-action">
                      {["notes", "bucket-list", "keepsakes"].includes(
                        feature.id,
                      ) && !data.actor
                        ? "Bring your invitation"
                        : "Open a little surprise"}
                      <ArrowRight size={17} />
                    </span>
                  </Link>
                );
              })}
            </div>
          </section>
        ),
      )}
    </>
  );
}
