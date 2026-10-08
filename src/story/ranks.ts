/** Rank tier names, from deadlock-api /v1/assets/ranks (2026-10-07). */
const TIER_NAMES: Record<number, string> = {
  0: "Obscurus",
  1: "Initiate",
  2: "Seeker",
  3: "Acolyte",
  4: "Sentinel",
  5: "Mystic",
  6: "Ritualist",
  7: "Emissary",
  8: "Oracle",
  9: "Phantom",
  10: "Ascendant",
  11: "Eternus",
};

/** "Oracle 1", or "Tier 99 · 2" for a tier the map does not know. */
export function rankLabel({ tier, subrank }: { tier: number; subrank: number }): string {
  const name = TIER_NAMES[tier];
  return name ? (subrank > 0 ? `${name} ${subrank}` : name) : `Tier ${tier} · ${subrank}`;
}
