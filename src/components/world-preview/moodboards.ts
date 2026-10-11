/**
 * Mood boards for the three rough worlds. Images are hot-linked from Steam's store page for
 * Deadlock (app 1422450) and never committed: the repo is public (ADR 0068).
 */
const steam = (hash: string) =>
  `https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1422450/${hash}/ss_${hash}.600x338.jpg`;

const REF = {
  header:
    "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1422450/aa249c5e8cc8f90941bd1dbdc311773cd1afe065/header.jpg",
  ritual: steam("fa25560cf85debe669f5d4acd76cf81b0943019b"),
  roster: steam("1a5a68e51d6aff5e2910410f84854c4c39af68cc"),
  amberPatron: steam("52159118573367c304c43fc9ed85588c0c518a19"),
  sapphirePatron: steam("ac02851ede518092df55746dbc98a199c91d7411"),
  alley: steam("caaf254176430d69244b99e565d3d56559f1743b"),
};

export type WorldId = "street" | "fog" | "lane";

export interface MoodBoard {
  id: WorldId;
  name: string;
  pitch: string;
  palette: string[];
  notes: string[];
  images: { src: string; caption: string }[];
}

export const MOOD_BOARDS: MoodBoard[] = [
  {
    id: "street",
    name: "Neon Cursed Apple street",
    pitch:
      "Night on a wet 1920s New York street: Art Deco towers, neon signs, a glowing apple sign.",
    palette: ["#0d0b10", "#ff3d7f", "#3de0c8", "#4fb37c", "#ffb347"],
    notes: [
      "Stepped Art Deco towers with lit windows, fading into fog",
      "Neon signs in pink, teal and green; a Cursed Apple sign at the end of the street",
      "Wet road that catches the neon; street lamps; floating dust",
      "Busiest look of the three, so the story cards sit on a darker glass panel",
    ],
    images: [
      { src: REF.header, caption: "Key art: the cast and the city" },
      { src: REF.alley, caption: "Street-level brick and stone, warm lamps" },
      { src: REF.roster, caption: "Poster-style red, teal and ink" },
    ],
  },
  {
    id: "fog",
    name: "Occult fog",
    pitch: "A thick green fog, a ritual circle, floating crystals and the Patron looming behind.",
    palette: ["#0a120e", "#4fb37c", "#9dffb0", "#6a4c8c", "#c9a24b"],
    notes: [
      "Heavy green fog: buildings are silhouettes, so it is the calmest behind text",
      "A glowing ritual circle with floating green crystals, like the mansion seance",
      "Slow-turning sigil rings in the air; a tall antlered Patron figure far back",
      "Cheapest of the three to run (fog hides distance)",
    ],
    images: [
      { src: REF.ritual, caption: "Green ritual circle and candles" },
      { src: REF.amberPatron, caption: "The Patron: a looming figure, warm light" },
      { src: REF.sapphirePatron, caption: "The other Patron: cold blue glow" },
    ],
  },
  {
    id: "lane",
    name: "The lane",
    pitch: "Dusk in a Deadlock lane: troopers march, Guardians stand watch, zip lines overhead.",
    palette: ["#2a1e1a", "#e8a25a", "#ff8a3d", "#3d8bff", "#ece6d8"],
    notes: [
      "A city street turned battle lane, amber team at one end, sapphire at the other",
      "Small troopers marching to meet in the middle; Guardian statues on plinths",
      "Zip lines on poles along the lane with a rider sliding along",
      "Warmest light; most like real gameplay, best fit for duels later",
    ],
    images: [
      { src: REF.alley, caption: "Lane-side stone, sand and warm light" },
      { src: REF.amberPatron, caption: "Amber team colour" },
      { src: REF.sapphirePatron, caption: "Sapphire team colour" },
    ],
  },
];
