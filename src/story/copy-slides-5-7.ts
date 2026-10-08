import { PARRY_KING_RATE } from "@/lib/stats/story";
import { leadKillType, type KillType } from "./kill-shares";
import type { StoryData } from "./types";

/**
 * Copy for slides 5 to 7 (How you kill, Precision, Mid Boss), kept apart from `copy.ts` so the
 * slide PRs don't collide (ADR 0053). Tone: hype, playful, PG-13 (ADR 0007). Headlines stay in
 * `copy.ts`; this file holds the labels and the data-driven lines.
 */

type Kills = StoryData["kills"];
type Precision = StoryData["precision"];
type MidBoss = StoryData["midBoss"];

// ---- Slide 5: How you kill ------------------------------------------------------------------

export const KILLS_COPY = {
  total: "kills on the ledger",
  types: {
    bullet: "Bullets",
    ability: "Abilities",
    melee: "Melee",
    headshot: "Headshots",
  } satisfies Record<KillType, string>,
  rangeHeading: "Range",
  closeup: "Close-up",
  longDistance: "Long-distance",
} as const;

/** One line about the kind of kill that leads. */
export function killsLead(kills: Pick<Kills, "bullet" | "ability" | "melee">): string {
  switch (leadKillType(kills)) {
    case "bullet":
      return "Guns blazing. Most of your kills came down the barrel.";
    case "ability":
      return "Spells over bullets. Your abilities do the talking.";
    case "melee":
      return "Up close and personal. You love a good smack.";
    default:
      return "No kills on the ledger yet. The streets are quiet, for now.";
  }
}

/** One line about close-up versus long-distance; null when neither was recorded. */
export function rangeLine(closeup: number, longDistance: number): string | null {
  if (closeup + longDistance <= 0) return null;
  if (closeup > longDistance) return "You like to see their faces.";
  if (longDistance > closeup) return "Distance is no obstacle. Long shots are your thing.";
  return "Equally happy up close and from afar.";
}

// ---- Slide 6: Precision ---------------------------------------------------------------------

export const PRECISION_COPY = {
  accuracy: "Accuracy against heroes",
  headshotRate: "Headshot rate",
  parryHeading: "Parries",
} as const;

/** The king line, built from the live threshold so the copy and the label can't drift (ADR 0040). */
export function parryKingLine(): string {
  return `Parry king starts at ${Math.round(PARRY_KING_RATE * 100)}% of parries landed.`;
}

export interface ParryCopy {
  /** The stamped badge, or null when there is nothing to stamp. */
  badge: string | null;
  line: string;
  /** "30 landed, 20 missed"; null when the label is none. */
  detail: string | null;
}

export function parryCopy(p: Precision): ParryCopy {
  const detail = `${p.parrySuccess} landed, ${p.parryMiss} missed`;
  switch (p.parryLabel) {
    case "king":
      return { badge: "Parry king", line: "They swing, you answer. Crisp.", detail };
    case "clown":
      return {
        badge: "Parry clown",
        line: "Bold of you to keep trying. The timing is a work in progress.",
        detail,
      };
    default:
      return { badge: null, line: "No parries landed in this window.", detail: null };
  }
}

// ---- Slide 7: Mid Boss ----------------------------------------------------------------------

export interface MidBossCopy {
  /** The label that sits under the big count, or the whole message when nothing was claimed. */
  lead: string;
  line: string;
  /** Only when something was stolen. */
  stolen: string | null;
}

export function midBossCopy(m: MidBoss): MidBossCopy {
  const stolen =
    m.stolen > 0 ? `Stolen: ${m.stolen}. The other team did the work, you took the prize.` : null;
  if (m.claimed <= 0) {
    return {
      lead: "No Rejuvenators claimed yet",
      line: "The Mid Boss is still waiting for you. Go say hello, he brings gifts.",
      stolen,
    };
  }
  const lead = m.claimed === 1 ? "Rejuvenator claimed" : "Rejuvenators claimed";
  if (m.claimed < 5) return { lead, line: "A taste of the Mid Boss life.", stolen };
  if (m.claimed < 25) return { lead, line: "You know the way to the pit by heart.", stolen };
  return { lead, line: "The Mid Boss has you on speed dial.", stolen };
}
