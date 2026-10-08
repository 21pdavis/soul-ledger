import { PARRY_KING_RATE } from "@/lib/stats/story";
import type { KillType } from "./kill-shares";
import type { StoryData } from "./types";

/**
 * Copy for slides 5 to 7 (How you kill, Precision, Mid Boss), kept apart from `copy.ts` so the
 * slide PRs don't collide (ADR 0053). Tone: hype, playful, PG-13 (ADR 0007). Headlines stay in
 * `copy.ts`; this file holds the labels, one fixed line per slide, and the plan-sanctioned branches (parry king, clown or none; Mid Boss with 0 claimed).
 */

type Precision = StoryData["precision"];
type MidBoss = StoryData["midBoss"];

// ---- Slide 5: How you kill ------------------------------------------------------------------

export const KILLS_COPY = {
  /** The one fixed line for this slide (ADR 0053: data-driven variants only on roast and MVP). */
  line: "Every takedown, entered in the ledger.",
  types: {
    bullet: "Bullets",
    // Headshots are a subset of bullet kills, so the row says so.
    headshot: "of which headshots",
    ability: "Abilities",
    melee: "Melee",
  } satisfies Record<KillType, string>,
  rangeHeading: "Range",
  closeup: "Close-up",
  longDistance: "Long-distance",
} as const;

/** The label under the kill total, so one kill never reads "1 kills". */
export function killsTotalLabel(total: number): string {
  return total === 1 ? "kill on the ledger" : "kills on the ledger";
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
  /** Only when something was stolen (and so something was claimed). */
  stolen: string | null;
}

/** Claimed and stolen are both the player's TEAM's counts (types.ts), so the copy says so. */
export function midBossCopy(m: MidBoss): MidBossCopy {
  if (m.claimed <= 0) {
    return {
      lead: "No Rejuvenators claimed by your team yet",
      line: "The Mid Boss is still waiting for you. Go say hello, he brings gifts.",
      stolen: null,
    };
  }
  // Stolen is a subset of claimed, so it only ever shows next to a claimed count.
  const stolen =
    m.stolen > 0
      ? `Stolen by your team: ${m.stolen}. The other team killed the boss, your team took the prize.`
      : null;
  return {
    lead:
      m.claimed === 1 ? "Rejuvenator claimed by your team" : "Rejuvenators claimed by your team",
    line: "Your team knows the way to the pit.",
    stolen,
  };
}
