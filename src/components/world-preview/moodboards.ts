/**
 * The mood board for the city tour: official images from the City Never Sleeps map update page
 * (playdeadlock.com/cityneversleeps). Hot-linked from Valve's CDN and never committed: the repo is
 * public (ADR 0068).
 */
const CNS = "https://cdn.fastly.steamstatic.com/apps/deadlock/images/react/cityneversleeps";
const img = (file: string, caption: string) => ({ src: `${CNS}/${file}`, caption });

export interface BoardSection {
  title: string;
  palette: string[];
  notes: string[];
  images: { src: string; caption: string }[];
}

export const MOOD_BOARD: { name: string; pitch: string; sections: BoardSection[] } = {
  name: "City Never Sleeps tour",
  pitch:
    "A low-poly copy of the new map. The camera swoops through the three lanes past still, posed heroes; your stats decide who stands where.",
  sections: [
    {
      title: "The map",
      palette: ["#1a2030", "#4a3e4c", "#b97a52", "#2a2628"],
      notes: [
        "Round city: Blue lane down the middle, Green on the right, Yellow on the left",
        "Four districts between them: Theater, Chinatown, Haunted Lot, Plaza; mid boss in the middle",
        "Dusk everywhere: dark blue-grey sky, mauve haze, a warm band at the horizon",
        "Each lane's zip line glows in its colour, as in game; nothing flickers",
      ],
      images: [
        img("map_neutral.png", "All three lanes and the four districts"),
        img("header_city.webp", "The skyline"),
      ],
    },
    {
      title: "Blue lane: Uptown, Times Square, Downtown",
      palette: ["#3a3842", "#4c3f3c", "#5ab4ff", "#ffcf7a", "#ff3d5a"],
      notes: ["Grey stone and brick, marquees, billboards, elevated tracks, tall Deco towers"],
      images: [
        img("uptown_01.jpg", "Uptown: the ritual circle plaza"),
        img("times_square_05.jpg", "Times Square: the elevated tracks"),
        img("broadway_01.jpg", "Broadway signs"),
      ],
    },
    {
      title: "Green lane: Umbria University, Central Park, Brownstones",
      palette: ["#0e1915", "#24402d", "#50805c", "#6dff9a"],
      notes: ["Green lamps and hedges, the Hangman's Elm, stone bridges, brownstone rows"],
      images: [
        img("campus_01.jpg", "Umbria University gates"),
        img("central_park_02.jpg", "Central Park and the Hangman's Elm"),
        img("campus_02.jpg", "Brownstones"),
      ],
    },
    {
      title: "Yellow lane: Stock Exchange, Seaport, Old Fairfax",
      palette: ["#372c23", "#4f4032", "#7a6347", "#b59c6b", "#ffd24a"],
      notes: ["Sandstone and brass, the exchange's columns, dock cranes, silos and chimneys"],
      images: [
        img("stock_exchange_03.jpg", "Stock Exchange"),
        img("seaport_01.jpg", "Seaport Dock"),
        img("factory_03.jpg", "Old Fairfax Factories"),
      ],
    },
    {
      title: "Districts",
      palette: ["#6a2a22", "#4a3a48", "#26302a", "#c46aff"],
      notes: [
        "Chinatown's red neon and bell tower, the Theater dome, the Haunted Lot, the Plaza statue",
      ],
      images: [
        img("chinatown_01.jpg", "Chinatown"),
        img("haunted_slums_01.jpg", "Haunted Lot"),
        img("fairfax_plaza_01.jpg", "Plaza"),
      ],
    },
  ],
};
