/** Hero id to display name, from deadlock-api /v1/assets/heroes (2026-10-07). The roster changes with patches, so unknown ids fall back to "Hero #id". */
const HERO_NAMES: Record<number, string> = {
  1: "Infernus",
  2: "Seven",
  3: "Vindicta",
  4: "Lady Geist",
  6: "Abrams",
  7: "Wraith",
  8: "McGinnis",
  10: "Paradox",
  11: "Dynamo",
  12: "Kelvin",
  13: "Haze",
  14: "Holliday",
  15: "Bebop",
  16: "Calico",
  17: "Grey Talon",
  18: "Mo & Krill",
  19: "Shiv",
  20: "Ivy",
  21: "Kali",
  25: "Warden",
  27: "Yamato",
  31: "Lash",
  35: "Viscous",
  38: "Gunslinger",
  39: "The Boss",
  48: "Wrecker",
  49: "Rutger",
  50: "Pocket",
  51: "Thumper",
  52: "Mirage",
  53: "Fathom",
  54: "Cadence",
  56: "Bomber",
  57: "Shield Guy",
  58: "Vyper",
  59: "Vandal",
  60: "Sinclair",
  61: "Trapper",
  62: "Raven",
  63: "Mina",
  64: "Drifter",
  65: "Venator",
  66: "Victor",
  67: "Paige",
  68: "Boho",
  69: "The Doorman",
  70: "Skyrunner",
  71: "Swan",
  72: "Billy",
  73: "Druid",
  74: "Graf",
  75: "Fortuna",
  76: "Graves",
  77: "Apollo",
  78: "Deadman Danny",
  79: "Rem",
  80: "Silver",
  81: "Celeste",
  82: "Opera",
  84: "Rat King",
  85: "Solomon",
  86: "Violet",
  87: "Nurse Harrow",
  88: "Baba",
};

export function heroName(heroId: number): string {
  return HERO_NAMES[heroId] ?? `Hero #${heroId}`;
}

/** Stand-in for hero art while art is placeholder: initials of the first two words, "?" if unknown. */
export function heroMonogram(heroId: number): string {
  const name = HERO_NAMES[heroId];
  if (!name) return "?";
  const words = name.split(/\s+/).filter((w) => /^\p{L}/u.test(w));
  return words
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");
}
