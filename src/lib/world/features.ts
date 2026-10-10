import type { FeatureId, WorldSettings } from "./schemas";
export const features: {
  id: FeatureId;
  title: string;
  description: string;
  group: string;
}[] = [
  {
    id: "letters",
    title: "Open when…",
    description: "A little envelope for every kind of day.",
    group: "Letters & little feelings",
  },
  {
    id: "voice",
    title: "A voice inside a memory",
    description: "Press play when you want to hear a little more.",
    group: "Letters & little feelings",
  },
  {
    id: "today",
    title: "A little note for today",
    description: "The same small kindness, waiting all day.",
    group: "Letters & little feelings",
  },
  {
    id: "mood",
    title: "How is your little heart?",
    description: "Choose a feeling. Find a gentle surprise.",
    group: "Letters & little feelings",
  },
  {
    id: "notes",
    title: "Leave me a little note",
    description: "A private paper trail between two people.",
    group: "Letters & little feelings",
  },
  {
    id: "map",
    title: "Our memory map",
    description: "Some places become a little part of our story.",
    group: "Places & possibilities",
  },
  {
    id: "dates",
    title: "Our special dates",
    description: "Little circles around days that matter.",
    group: "Places & possibilities",
  },
  {
    id: "capsules",
    title: "Something is waiting",
    description: "Packages to open when the right day arrives.",
    group: "Places & possibilities",
  },
  {
    id: "bucket-list",
    title: "Our someday notebook",
    description: "Ideas waiting to become beautiful memories.",
    group: "Places & possibilities",
  },
  {
    id: "music",
    title: "Songs that feel like you",
    description: "A cassette, a dedication, a little moment.",
    group: "Places & possibilities",
  },
  {
    id: "photo-booth",
    title: "Our little photo booth",
    description: "Make a Polaroid. Add a note. Keep it close.",
    group: "Things to make & keep",
  },
  {
    id: "companion",
    title: "Meet your tiny cloud",
    description: "A quiet little guide, whenever you want one.",
    group: "Things to make & keep",
  },
  {
    id: "garden",
    title: "Our growing garden",
    description: "Every flower has a real story behind it.",
    group: "Things to make & keep",
  },
  {
    id: "surprise",
    title: "Surprise me with a memory",
    description: "Let a photograph find its way back to you.",
    group: "Things to make & keep",
  },
  {
    id: "keepsakes",
    title: "The secret keepsake drawer",
    description: "Photographs, little rewards, and things worth keeping.",
    group: "Things to make & keep",
  },
];
export const defaultWorldSettings: WorldSettings = {
  timeZone: "Asia/Kolkata",
  guestAccess: true,
  sharedBucket: true,
  noteRetentionDays: 365,
  boothSharing: false,
  companionHints: [
    "There are seven little hearts hiding in the story.",
    "A letter is waiting whenever you need a quiet moment.",
    "The garden has room for another beautiful memory.",
  ],
  surpriseFilter: "all",
  surpriseIds: [],
  excludedIds: [],
  stickers: ["heart", "flower", "star"],
};
