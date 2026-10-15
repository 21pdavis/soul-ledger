import type { BulkMatch, MatchLineup } from "@/lib/deadlock-api/schemas";
import type { DeathPoint, PlayerMatch } from "./types";

/** Third value of a death that was read but had no enemy killer (not a hero id). */
export const NO_ENEMY_KILLER = 0;

/**
 * Adds the killer's hero id to a stored match's deaths (`[x, y]` becomes `[x, y, heroId]`),
 * using the match lineup (the nemesis, ADR 0068). Only an enemy counts: a teammate, the player
 * themselves, or an unknown slot gets the sentinel `0` (never a hero id), meaning "read, no enemy
 * killer", so the match is not asked about again.
 *
 * Returns null when the lineup cannot be read: the player is missing from it, or it lists a
 * different number of deaths than we stored (so the order cannot be trusted). The caller then
 * leaves the row alone.
 */
export function tagKillers(
  deaths: DeathPoint[],
  accountId: number,
  lineup: MatchLineup,
): DeathPoint[] | null {
  const me = lineup.players.find((p) => p.account_id === accountId);
  if (!me || me.death_details.length !== deaths.length) return null;
  return deaths.map((d, i): DeathPoint => {
    const slot = me.death_details[i].killer_player_slot;
    const killer = slot == null ? undefined : lineup.players.find((p) => p.player_slot === slot);
    if (!killer || killer.team === me.team) return [d[0], d[1], NO_ENEMY_KILLER];
    return [d[0], d[1], killer.hero_id];
  });
}

/** Accolade ids from /v1/assets/accolades (wiki/research/match-metadata-fields.md). */
export const ACCOLADE = {
  breakablesDestroyed: 11,
  powerupsCollected: 12,
  returnedIdol: 13,
  sinnersSacrificeJackpot: 14,
  closeupKills: 17,
  longDistanceKills: 18,
} as const;

/** Keys inside final_stats.custom_user_stats. */
const CUSTOM = {
  heroShots: "Enemy Hero Accuracy##Shots",
  heroHits: "Enemy Hero Accuracy##Hits",
  heroHeadshots: "Enemy Hero Accuracy##Headshots",
  parrySuccess: "Parry Success",
  parryMiss: "Parry Miss",
  unspentGoldMinutes: "Unspent Gold Minutes",
} as const;

/** "StreetBrawl" -> "street_brawl", "Normal" -> "normal". */
function snake(value: string): string {
  return value.replace(/([a-z0-9])([A-Z])/g, "$1_$2").toLowerCase();
}

export function normalizePlayerMatch(match: BulkMatch, accountId: number): PlayerMatch {
  const p = match.players.find((pl) => pl.account_id === accountId);
  if (!p) throw new Error(`Account ${accountId} is not in match ${match.match_id}`);

  const fs = p.final_stats ?? {};
  const custom = fs.custom_user_stats ?? {};
  const accolade = (id: number) =>
    p.accolades.find((a) => a.accolade_id === id)?.accolade_stat_value ?? 0;

  const claimed = match.mid_boss.filter((b) => b.team_claimed === p.team);

  return {
    accountId,
    matchId: match.match_id,
    startTime: new Date(match.start_time.replace(" ", "T") + "Z"),
    durationS: match.duration_s,
    gameMode: snake(match.game_mode),
    matchMode: snake(match.match_mode),
    heroId: p.hero_id,
    won: match.winning_team === p.team,

    kills: p.kills,
    deaths: p.deaths,
    assists: p.assists,
    netWorth: p.net_worth,
    lastHits: p.last_hits,
    denies: p.denies,

    bulletKills: fs.bullet_kills ?? 0,
    abilityKills: fs.ability_kills ?? 0,
    meleeKills: fs.melee_kills ?? 0,
    headshotKills: fs.headshot_kills ?? 0,
    closeupKills: accolade(ACCOLADE.closeupKills),
    longDistanceKills: accolade(ACCOLADE.longDistanceKills),

    shotsHit: fs.shots_hit ?? 0,
    shotsMissed: fs.shots_missed ?? 0,
    heroBulletsHit: fs.hero_bullets_hit ?? 0,
    heroBulletsHitCrit: fs.hero_bullets_hit_crit ?? 0,
    heroShots: custom[CUSTOM.heroShots] ?? 0,
    heroHits: custom[CUSTOM.heroHits] ?? 0,
    heroHeadshots: custom[CUSTOM.heroHeadshots] ?? 0,
    parrySuccess: custom[CUSTOM.parrySuccess] ?? 0,
    parryMiss: custom[CUSTOM.parryMiss] ?? 0,
    unspentGoldMinutes: custom[CUSTOM.unspentGoldMinutes] ?? 0,

    breakables: accolade(ACCOLADE.breakablesDestroyed),
    sinnerJackpots: accolade(ACCOLADE.sinnersSacrificeJackpot),
    idolsReturned: accolade(ACCOLADE.returnedIdol),
    powerupsCollected: accolade(ACCOLADE.powerupsCollected),

    playerDamage: fs.player_damage ?? 0,
    teammateHealing: fs.teammate_healing ?? 0,
    bossDamage: fs.boss_damage ?? 0,

    midBossClaimed: claimed.length,
    midBossStolen: claimed.filter((b) => b.team_killed !== p.team).length,

    deathPositions: p.death_details.map((d) => [d.death_pos[0], d.death_pos[1]]),
  };
}
