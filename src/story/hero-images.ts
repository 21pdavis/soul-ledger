/**
 * Hero id to the image slug on deadlock-api assets (from /v1/assets/heroes, 2026-10-08). Heroes with
 * no usable image stay absent and keep their monogram tile: Shield Guy, Bomber and other unreleased
 * ids have none, and Vyper (58) and Boho (68) point at other heroes' art in the API. Images are
 * hotlinked, never committed (ADR 0064).
 */
const HERO_IMAGE_SLUGS: Record<number, string> = {
  1: "inferno",
  2: "gigawatt",
  3: "hornet",
  4: "spectre",
  6: "bull",
  7: "wraith",
  8: "engineer",
  10: "chrono",
  11: "sumo",
  12: "kelvin",
  13: "haze",
  14: "astro",
  15: "bebop",
  16: "nano",
  17: "archer",
  18: "digger",
  19: "shiv",
  20: "tengu",
  21: "kali",
  25: "warden",
  27: "yamato",
  31: "lash",
  35: "viscous",
  38: "gunslinger",
  39: "yakuza",
  48: "wrecker",
  49: "rutger",
  50: "synth",
  51: "thumper",
  52: "mirage",
  53: "slork",
  54: "cadence",
  59: "vandal",
  60: "magician",
  61: "trapper",
  62: "operative",
  63: "vampirebat",
  64: "drifter",
  65: "priest",
  66: "frank",
  67: "bookworm",
  69: "doorman",
  70: "skyrunner",
  71: "swan",
  72: "punkgoat",
  73: "druid",
  74: "graf",
  75: "fortuna",
  76: "necro",
  77: "fencer",
  79: "familiar",
  80: "werewolf",
  81: "unicorn",
  84: "ratking",
  88: "baba",
};

const BASE = "https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes";

/** The small hero icon URL, or null when we have none. */
export function heroImageUrl(heroId: number): string | null {
  const slug = HERO_IMAGE_SLUGS[heroId];
  return slug ? `${BASE}/${slug}_sm.webp` : null;
}
