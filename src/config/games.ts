import { gameConfigSchema, type GameConfig } from "@/lib/games/schemas";
const feedback = {
  correct: "Yaad tha! Nice, sahi answer. ♡",
  incorrect:
    "Koi na, next wala try karo.",
  opinion: "Done, yeh plan bhi list mein.",
};
const opinion = (id: string, question: string, labels: string[]) => ({
  id,
  question,
  options: labels.map((label, i) => ({ id: `a${i}`, label })),
  feedback,
});
export const defaultGames: GameConfig = gameConfigSchema.parse({
  version: 1,
  games: [
    {
      id: "quiz",
      title: "Kitna jaanti ho humein?",
      description: "Bas kuch sawaal hain. Dekhein, kitna yaad hai tumhe?",
      enabled: true,
      displayOrder: 0,
      themeVariant: "cream",
    },
    {
      id: "match",
      title: "Yaadon ki jodi banao",
      description: "Do same photos dhoondhni hain. Easy lag raha hai? Try karo.",
      enabled: true,
      displayOrder: 1,
      themeVariant: "peach",
    },
    {
      id: "hearts",
      title: "Mera dil dhoondo",
      description: "Saat hearts chhupe hain. Dhoondho, har ek pe kuch likha hai.",
      enabled: true,
      displayOrder: 2,
      themeVariant: "sage",
    },
    {
      id: "bouquet",
      title: "Princess ka bouquet",
      description: "Apne favourite flowers lo aur bouquet bana lo.",
      enabled: true,
      displayOrder: 3,
      themeVariant: "cream",
    },
    {
      id: "guess",
      title: "Yeh kaunsi yaad hai?",
      description:
        "Photo blur hai. Clues dekh ke guess karo kaunsi hai.",
      enabled: true,
      displayOrder: 4,
      themeVariant: "sage",
    },
    {
      id: "adventure",
      title: "Agla plan kya hai?",
      description: "Tum choose karo, saath mein kya karna hai. Plan bana lete hain.",
      enabled: true,
      displayOrder: 5,
      themeVariant: "peach",
    },
  ],
  quizQuestions: [
    opinion("day", "Free day mile toh kya karein?", [
      "Picnic pe chalein",
      "Road trip",
      "Beach pe chill karein",
    ]),
    opinion("smile", "Mood achha karne ke liye kya doon tumhe?", [
      "Ek cute sa message",
      "Fresh tulips",
      "Favourite gaana",
    ]),
    {
      id: "sample-caption",
      question:
        "Gallery mein yellow flowers wali photo kaunsi hai?",
      imageId: "demo-3",
      options: [
        { id: "flowers", label: "Peele flowers wali" },
        { id: "sea", label: "Samandar ki lehron wali" },
        { id: "sunset", label: "Sunset wali" },
      ],
      correctAnswerId: "flowers",
      feedback,
    },
    opinion("weather", "Walk pe kab jaana hai?", [
      "Sunset ke time",
      "Subah, jab dhoop kam ho",
      "Baarish ke baad",
    ]),
    opinion("treat", "Saath mein kya leke chalein?", [
      "Ice cream",
      "Coffee",
      "Picnic basket",
      "Ghar se snacks",
    ]),
    {
      id: "sample-sea",
      question: "Is sample photo ka title kaunsa hai?",
      imageId: "demo-2",
      options: [
        { id: "sea", label: "Where the sky meets the sea" },
        { id: "sun", label: "A little sunshine" },
      ],
      correctAnswerId: "sea",
      feedback,
    },
    opinion("keep", "Din achha jaaye toh kya save karogi?", [
      "Ek photo",
      "Ek flower",
      "Haath se likha note",
    ]),
    opinion("next", "Next time kahan chalein?", [
      "Kahin nayi jagah",
      "Wahi favourite jagah",
      "Kahin bhi, bas saath",
    ]),
  ],
  puzzles: [
    {
      id: "sample-flowers",
      approvedMediaId: "demo-3",
      question: "Guess karo, kaunsi photo hai?",
      clues: [
        "Ismein flowers hain.",
        "Yellow colour notice kiya?",
        "Beach wali photo nahi hai.",
      ],
      possibleAnswers: [
        { id: "flowers", label: "Something beautiful" },
        { id: "sea", label: "Where the sky meets the sea" },
        { id: "sun", label: "Chasing the sunset" },
      ],
      correctAnswerId: "flowers",
      revealMessage:
        "Sahi, flowers wali! Abhi sample hai. Baad mein apni photo pe khelte hain.",
    },
    {
      id: "sample-waves",
      approvedMediaId: "demo-4",
      question: "Guess karo, kaunsi photo hai?",
      clues: [
        "Ismein waves hain.",
        "Blue water aur white foam.",
        "Beach wali photo dhoondho.",
      ],
      possibleAnswers: [
        { id: "waves", label: "Stay a little longer" },
        { id: "flowers", label: "Something beautiful" },
      ],
      correctAnswerId: "waves",
      revealMessage:
        "Haan, yahi wali! Abhi sample hai, baad mein apni photo lagayenge.",
    },
  ],
  hearts: [
    "home",
    "memories",
    "timeline",
    "garden",
    "letter",
    "gallery",
    "ending",
  ].map((chapterId, i) => ({
    id: `heart-${i + 1}`,
    chapterId,
    position: { x: i % 2 ? 12 : 87, y: chapterId === "home" ? 82 : 72 },
    message: [
      "Tumse baat ho jaaye toh din achha lagta hai.",
      "Yeh photos phir saath mein dekhna hai.",
      "Tumhare saath aur time chahiye. Bas.",
      "Waise, tum aaj bhi cute lag rahi ho.",
      "Ek message likha hai. Woh bhi padh lena.",
      "Princess, ek smile toh do.",
      "Next time saath mein photos lenge, okay?",
    ][i],
    enabled: true,
  })),
  flowers: [
    {
      id: "daisy",
      label: "Daisy",
      availableColors: ["#fff8dc", "#efb9c1"],
      optionalMeaning: "A little sunshine",
    },
    {
      id: "tulip",
      label: "Tulip",
      availableColors: ["#e7a9a2", "#e5c484"],
      optionalMeaning: "Tumhare favourite wale",
    },
    {
      id: "rose",
      label: "Rose",
      availableColors: ["#d78d9c", "#e9bbaf"],
      optionalMeaning: "Bas tumhare liye",
    },
    {
      id: "wildflower",
      label: "Wildflower",
      availableColors: ["#a9bcd1", "#c4b3d0"],
      optionalMeaning: "Kahin ghoomne chalein?",
    },
  ],
  adventureQuestions: [
    ["sky", "Subah chalein ya shaam ko?", "sunrise", "Sunrise", "sunset", "Sunset"],
    ["place", "Kahan jaana hai?", "mountains", "Mountains", "beach", "Beach"],
    ["treat", "Kya khaana hai?", "coffee", "Coffee", "ice-cream", "Ice cream"],
    [
      "activity",
      "Phir kya karein?",
      "drive",
      "Long drive",
      "movie",
      "Cosy movie",
    ],
    [
      "gift",
      "Aur tumhe kya chahiye?",
      "flowers",
      "Flowers",
      "chocolates",
      "Chocolates",
    ],
    [
      "meal",
      "Dinner ka kya plan hai?",
      "picnic",
      "Picnic",
      "dinner",
      "Dinner date",
    ],
  ].map(([id, question, a, al, b, bl]) => ({
    id,
    question,
    optionA: { id: a, label: al },
    optionB: { id: b, label: bl },
  })),
  messages: {
    quiz: "Score jo bhi ho, meri favourite toh tum hi ho. Har baar. ♡",
    match:
      "Saari photos match ho gayi! Bola tha na, kar logi. ♡",
    heartReward:
      "Saare hearts mil gaye! Ab messages bhi padh lena. ♡",
    bouquet:
      "Yeh bouquet tumhare liye. Next time asli flowers bhi, okay?",
    guessReward: "Sahi guess! Ek aur photo dekh lo. ♡",
  },
});
