import type { StoryData } from "./types";

type Kills = StoryData["kills"];
type Precision = StoryData["precision"];

/** The kill types the breakdown lists, in display order. */
export type KillType = "bullet" | "ability" | "melee" | "headshot";

/** Part over whole, within 0..1. A whole of 0 (or a bad number) gives 0, never NaN or Infinity. */
export function share(part: number, whole: number): number {
  if (!Number.isFinite(part) || !Number.isFinite(whole) || whole <= 0) return 0;
  return Math.min(1, Math.max(0, part / whole));
}

/** One breakdown row per kill type, each with its share of all kills. */
export function killRows(kills: Kills): { key: KillType; count: number; share: number }[] {
  const keys: KillType[] = ["bullet", "ability", "melee", "headshot"];
  return keys.map((key) => ({ key, count: kills[key], share: share(kills[key], kills.total) }));
}

/** Close-up versus long-distance, as shares of the two added together. */
export function rangeShares(closeup: number, longDistance: number) {
  const whole = closeup + longDistance;
  return { closeup: share(closeup, whole), longDistance: share(longDistance, whole) };
}

/** The biggest of bullet, ability and melee (ties go in that order); null with none of them. */
export function leadKillType(
  kills: Pick<Kills, "bullet" | "ability" | "melee">,
): "bullet" | "ability" | "melee" | null {
  const order = ["bullet", "ability", "melee"] as const;
  const lead = order.reduce((best, key) => (kills[key] > kills[best] ? key : best), order[0]);
  return kills[lead] > 0 ? lead : null;
}

/** Parries landed over parries tried; 0 when there were none. */
export function parryRate(p: Pick<Precision, "parrySuccess" | "parryMiss">): number {
  return share(p.parrySuccess, p.parrySuccess + p.parryMiss);
}
