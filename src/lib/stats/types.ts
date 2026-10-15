/** One player's flattened result in one match: the unit every stat is computed from. */
export interface PlayerMatch {
  accountId: number;
  matchId: number;
  startTime: Date;
  durationS: number;
  /** "normal" | "street_brawl" | other modes lower-cased. */
  gameMode: string;
  /** "ranked" | "unranked" | ... lower-cased. */
  matchMode: string;
  heroId: number;
  won: boolean;

  kills: number;
  deaths: number;
  assists: number;
  netWorth: number;
  lastHits: number;
  denies: number;

  bulletKills: number;
  abilityKills: number;
  meleeKills: number;
  headshotKills: number;
  closeupKills: number;
  longDistanceKills: number;

  /** All bullets that hit or missed anything (the API's global "accuracy" metric). */
  shotsHit: number;
  shotsMissed: number;
  /** Bullets that hit heroes, and those that crit (the API's "crit_shot_rate"). */
  heroBulletsHit: number;
  heroBulletsHitCrit: number;
  /** Bullets fired at, hitting, and headshotting enemy heroes. */
  heroShots: number;
  heroHits: number;
  heroHeadshots: number;
  parrySuccess: number;
  parryMiss: number;
  unspentGoldMinutes: number;

  breakables: number;
  sinnerJackpots: number;
  idolsReturned: number;
  powerupsCollected: number;

  playerDamage: number;
  teammateHealing: number;
  bossDamage: number;

  /** Rejuvenators claimed by the player's team, and how many of those the enemy had killed. */
  midBossClaimed: number;
  midBossStolen: number;

  /**
   * Map x/y of every death. A third number, when present, is the hero id of the enemy that
   * made the kill (it lives inside the existing JSON column, so it needs no migration).
   */
  deathPositions: DeathPoint[];
}

/** `[x, y]`, or `[x, y, killerHeroId]` when the killer is known. */
export type DeathPoint = [number, number] | [number, number, number];
