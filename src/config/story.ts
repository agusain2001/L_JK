import type { MemoryMedia } from "@/types/memory";

// All personal copy lives here. Sample photographs are scenery, not relationship history.
const recipientName = "Rashika";
export const loveStory = {
  siteTitle: `For ${recipientName} ♡`,
  girlfriendName: recipientName,
  senderName: "",
  hero: {
    title: `${recipientName}, ek chhota sa surprise, sirf tumhare liye`,
    lines: {
      opening: `${recipientName},`,
      lead: "ek chhota sa",
      emphasis: "surprise,",
      ending: "sirf tumhare liye.",
    },
    description:
      "Tumhe tulips pasand hain, toh unse hi start kiya. Baaki sab bhi tumhare liye hai. Aaram se dekhna, okay?",
  },
  letter: {
    greeting: `${recipientName}, suno na...`,
    paragraphs: [
      "Socha tumhare liye kuch alag karun. Phir laga, ek surprise bana deta hoon jo tum jab chaaho khol sako. Toh haan, yeh sab tumhare liye hai.",
      "Tumse baat karke achha lagta hai. Koi special topic bhi nahi chahiye. Tum apne din ki normal si baat bhi batao na, main sunta rahun.",
      "Aur tumhari smile... uski toh baat hi alag hai. Bas yahi soch ke banaya ki tum dekho aur bolo, 'achha, mere liye?' Haan madam, tumhare liye hi.",
      "Kabhi mood off ho toh mujhe bata dena. Har baar solution nahi hoga mere paas, but sunne ke liye toh hoon. Baat nahi karni ho toh bhi okay, saath toh hoon na.",
      `Achha, ab itni tareef kaafi hai warna tum mujhe tease karogi. Smile karo, ${recipientName}. Aur bataana, surprise kaisa laga?`,
    ],
    signature: "Bas, yahi kehna tha.",
  },
  notes: [
    {
      title: "Tumhari smile",
      message:
        "Tumhari smile dekh ke main bhi smile karne lagta hoon. Ab isko kya bolte hain, mujhe nahi pata.",
      doodle: "sun",
    },
    {
      title: "Tumhari hasi",
      message:
        "Tum hasti ho na, toh aur baat karne ka mann karta hai. Bas thodi der aur.",
      doodle: "flower",
    },
    {
      title: "Bas tum",
      message:
        "Waise tumhe bataya hai ki tum cute ho? Bataya hoga. Ek baar aur sun lo.",
      doodle: "heart",
    },
    {
      title: "Tumhari care",
      message:
        "Tum jab mera haal poochti ho na, achha lagta hai. Chhoti si baat hai, but mere liye kaafi hai.",
      doodle: "heart",
    },
  ],
  garden: [
    "Flowers tumhare, aur ek smile mere liye. Deal?",
    `${recipientName}, yeh wala bhi rakh lo. Tumhe flowers dene ke liye reason thodi chahiye.`,
    "Tumse baat karte hue time ka pata hi nahi chalta. Phir lagta hai, bas paanch minute aur.",
  ],
  favouriteThings: [
    "Tumhare favourite tulips",
    "Tumhare saath hasna",
    "Saath mein walk pe jaana",
    "Aur tumse baat karna",
  ],
  finalMessage: `${recipientName}, next time sirf screen pe nahi, saath mein walk pe chalna hai. ♡`,
  surprise: `${recipientName}, tumhara message aata hai na, toh phone dekh ke smile aa jaati hai. Bas, itni si baat thi. ♡`,
  // Starts on the garden's first action; never plays before a user gesture.
  soundtrack: "/audio/heartwarming.mp3",
  soundtrackCredit: {
    title: "Heartwarming",
    artist: "Kevin MacLeod",
    source: "https://incompetech.com/music/royalty-free/index.html?isrc=USUAN1100207",
    license: "CC BY 4.0",
    licenseUrl: "https://creativecommons.org/licenses/by/4.0/",
  },
};

export const demoMemories: MemoryMedia[] = [
  {
    id: "demo-1",
    title: "A little sunshine",
    caption: "thodi si dhoop ♡",
    mediaUrl: "/images/memory-1.webp",
    tags: ["little things"],
    featured: true,
    order: 0,
  },
  {
    id: "demo-2",
    title: "Where the sky meets the sea",
    caption: "beach pe baith ke bas baatein karni hain",
    mediaUrl: "/images/memory-2.webp",
    tags: ["outdoors"],
    featured: true,
    order: 1,
  },
  {
    id: "demo-3",
    title: "Something beautiful",
    caption: "yeh flowers tumhe achhe lagenge na?",
    mediaUrl: "/images/memory-3.webp",
    tags: ["little things"],
    featured: true,
    order: 2,
  },
  {
    id: "demo-4",
    title: "Stay a little longer",
    caption: "thoda aur ruk jao na ♡",
    mediaUrl: "/images/memory-4.webp",
    tags: ["outdoors"],
    featured: true,
    order: 3,
  },
  {
    id: "demo-5",
    title: "A softer kind of day",
    caption: "aaj yahin baithne ka mann hai",
    mediaUrl: "/images/memory-5.webp",
    tags: ["little things"],
    featured: true,
    order: 4,
  },
  {
    id: "demo-6",
    title: "Chasing the sunset",
    caption: "yeh sunset saath mein dekhna hai",
    mediaUrl: "/images/memory-6.webp",
    tags: ["outdoors"],
    featured: true,
    order: 5,
  },
].map((m) => ({
  ...m,
  kind: "image",
  description:
    "Abhi yeh sample photo hai. Baad mein yahan apni photo lagayenge.",
  approved: true,
  chapter: "memories",
  demo: true,
}));
