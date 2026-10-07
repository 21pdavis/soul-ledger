import type { MmrHistoryEntry, StatMetrics } from "@/lib/deadlock-api/schemas";
import { comparePlayer, type PercentileResult } from "./percentiles";
import type { PlayerMatch } from "./types";

/** Main-hero share at or above which a player is a one-trick (ADR 0038). */
export const ONE_TRICK_SHARE = 0.5;
/** Parry success rate at or above which a player is a parry king rather than a clown (ADR 0040). */
export const PARRY_KING_RATE = 0.6;
/** Fewest main-hero matches before we rank against that hero's players. */
export const MIN_HERO_SAMPLE = 10;

export interface RankPoint {
  at: Date;
  matchId: number;
  /** Badge number as the API writes it: tier * 10 + subrank (81 = Oracle 1). */
  badge: number;
  tier: number;
  subrank: number;
}

export type Mvp =
  (PercentileResult & { scope: "global" }) | (PercentileResult & { scope: "hero"; heroId: number });

/** Everything the v1 slides (ADR 0015) need, computed from stored matches. */
export interface Story {
  matchCount: number;
  /** Street Brawl and other non-normal games left out of every stat. */
  excludedMatches: number;
  intro: {
    matches: number;
    hoursPlayed: number;
    wins: number;
    winRate: number;
    firstMatchAt: Date | null;
    lastMatchAt: Date | null;
  };
  main: {
    heroId: number;
    matches: number;
    wins: number;
    winRate: number;
    share: number;
    /** Ranked against players of the same hero; empty below MIN_HERO_SAMPLE matches. */
    percentiles: PercentileResult[];
  } | null;
  roster: {
    heroesPlayed: number;
    label: "one-trick" | "flex";
    topHeroes: { heroId: number; matches: number; winRate: number }[];
  };
  scavenger: { breakables: number; sinnerJackpots: number; idolsReturned: number };
  kills: {
    total: number;
    bullet: number;
    ability: number;
    melee: number;
    headshot: number;
    closeup: number;
    longDistance: number;
  };
  precision: {
    heroAccuracy: number;
    headshotRate: number;
    parrySuccess: number;
    parryMiss: number;
    parryLabel: "king" | "clown" | "none";
  };
  midBoss: { claimed: number; stolen: number };
  roast: {
    deaths: number;
    deathPositions: [number, number][];
    avgUnspentGoldMinutes: number;
    worstMatch: { matchId: number; heroId: number; deaths: number } | null;
  };
  rank: { journey: RankPoint[]; current: RankPoint | null };
  /** Global percentiles across all counted matches. */
  percentiles: PercentileResult[];
  /** The signature stat (ADR 0021). */
  mvp: Mvp | null;
}

export interface StoryInput {
  matches: PlayerMatch[];
  rankHistory: MmrHistoryEntry[];
  globalMetrics: StatMetrics;
  /** Metrics filtered to the player's main hero. */
  mainHeroMetrics: StatMetrics;
}

/** Matches that count toward the story: normal mode only, so Street Brawl is left out. */
export function countedMatches(matches: PlayerMatch[]): PlayerMatch[] {
  return matches.filter((r) => r.gameMode === "normal");
}

/** Heroes by matches played (then wins), most played first. Index 0 is the main. */
export function rankHeroes(rows: PlayerMatch[]) {
  const byHero = new Map<number, PlayerMatch[]>();
  for (const r of rows) byHero.set(r.heroId, [...(byHero.get(r.heroId) ?? []), r]);
  return [...byHero.entries()]
    .map(([heroId, hr]) => ({
      heroId,
      matches: hr.length,
      wins: hr.filter((r) => r.won).length,
      rows: hr,
    }))
    .sort((a, b) => b.matches - a.matches || b.wins - a.wins);
}

export function computeStory(input: StoryInput): Story {
  const rows = countedMatches(input.matches);
  const total = (f: (r: PlayerMatch) => number) => rows.reduce((s, r) => s + f(r), 0);
  const rate = (num: number, den: number) => (den > 0 ? num / den : 0);

  const wins = rows.filter((r) => r.won).length;
  const times = rows.map((r) => r.startTime.getTime());

  const heroesByPlay = rankHeroes(rows);

  const top = heroesByPlay[0];
  const main = top
    ? {
        heroId: top.heroId,
        matches: top.matches,
        wins: top.wins,
        winRate: rate(top.wins, top.matches),
        share: rate(top.matches, rows.length),
        percentiles:
          top.matches >= MIN_HERO_SAMPLE ? comparePlayer(top.rows, input.mainHeroMetrics) : [],
      }
    : null;

  const parrySuccess = total((r) => r.parrySuccess);
  const parryMiss = total((r) => r.parryMiss);

  const worst = rows.reduce<PlayerMatch | null>(
    (w, r) => (!w || r.deaths > w.deaths ? r : w),
    null,
  );

  const journey = [...input.rankHistory]
    .sort((a, b) => a.start_time - b.start_time)
    .map((e) => ({
      at: new Date(e.start_time * 1000),
      matchId: e.match_id,
      badge: e.rank,
      tier: e.division,
      subrank: e.division_tier,
    }));

  const percentiles = comparePlayer(rows, input.globalMetrics);

  return {
    matchCount: rows.length,
    excludedMatches: input.matches.length - rows.length,
    intro: {
      matches: rows.length,
      hoursPlayed: total((r) => r.durationS) / 3600,
      wins,
      winRate: rate(wins, rows.length),
      firstMatchAt: rows.length ? new Date(Math.min(...times)) : null,
      lastMatchAt: rows.length ? new Date(Math.max(...times)) : null,
    },
    main,
    roster: {
      heroesPlayed: heroesByPlay.length,
      label: main && main.share >= ONE_TRICK_SHARE ? "one-trick" : "flex",
      topHeroes: heroesByPlay.slice(0, 5).map((h) => ({
        heroId: h.heroId,
        matches: h.matches,
        winRate: rate(h.wins, h.matches),
      })),
    },
    scavenger: {
      breakables: total((r) => r.breakables),
      sinnerJackpots: total((r) => r.sinnerJackpots),
      idolsReturned: total((r) => r.idolsReturned),
    },
    kills: {
      total: total((r) => r.kills),
      bullet: total((r) => r.bulletKills),
      ability: total((r) => r.abilityKills),
      melee: total((r) => r.meleeKills),
      headshot: total((r) => r.headshotKills),
      closeup: total((r) => r.closeupKills),
      longDistance: total((r) => r.longDistanceKills),
    },
    precision: {
      heroAccuracy: rate(
        total((r) => r.heroHits),
        total((r) => r.heroShots),
      ),
      headshotRate: rate(
        total((r) => r.heroHeadshots),
        total((r) => r.heroHits),
      ),
      parrySuccess,
      parryMiss,
      parryLabel:
        parrySuccess === 0
          ? "none"
          : rate(parrySuccess, parrySuccess + parryMiss) >= PARRY_KING_RATE
            ? "king"
            : "clown",
    },
    midBoss: { claimed: total((r) => r.midBossClaimed), stolen: total((r) => r.midBossStolen) },
    roast: {
      deaths: total((r) => r.deaths),
      deathPositions: rows.flatMap((r) => r.deathPositions),
      avgUnspentGoldMinutes: rate(
        total((r) => r.unspentGoldMinutes),
        rows.length,
      ),
      worstMatch: worst
        ? { matchId: worst.matchId, heroId: worst.heroId, deaths: worst.deaths }
        : null,
    },
    rank: { journey, current: journey.at(-1) ?? null },
    percentiles,
    mvp: pickMvp(percentiles, main),
  };
}

/**
 * The stat where the player is best relative to others, weighted toward unusual stats.
 * Same-hero comparisons win ties because they make the better line ("Top 1% of Paradox players").
 */
function pickMvp(global: PercentileResult[], main: Story["main"]): Mvp | null {
  const score = (p: PercentileResult) => (100 - p.topPercent) * p.weight;
  const candidates: Mvp[] = [
    ...(main
      ? main.percentiles.map((p) => ({ ...p, scope: "hero" as const, heroId: main.heroId }))
      : []),
    ...global.map((p) => ({ ...p, scope: "global" as const })),
  ];
  return candidates.reduce<Mvp | null>(
    (best, c) => (!best || score(c) > score(best) ? c : best),
    null,
  );
}
