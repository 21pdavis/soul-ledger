import { z } from "zod";

// Only the fields Soul Ledger reads are declared; unknown fields are stripped.
// Field meanings: wiki/research/match-metadata-fields.md

export const matchHistoryEntry = z.object({
  account_id: z.number(),
  match_id: z.number(),
  hero_id: z.number(),
  start_time: z.number(),
  game_mode: z.number(),
  match_mode: z.number(),
  match_duration_s: z.number(),
});
export type MatchHistoryEntry = z.infer<typeof matchHistoryEntry>;

const num = z.number().optional();

export const finalStats = z.object({
  kills: num,
  deaths: num,
  assists: num,
  bullet_kills: num,
  ability_kills: num,
  melee_kills: num,
  headshot_kills: num,
  shots_hit: num,
  shots_missed: num,
  hero_bullets_hit: num,
  hero_bullets_hit_crit: num,
  player_damage: num,
  player_damage_taken: num,
  player_healing: num,
  teammate_healing: num,
  boss_damage: num,
  net_worth: num,
  custom_user_stats: z.record(z.string(), z.number()).optional(),
});

export const bulkPlayer = z.object({
  account_id: z.number(),
  hero_id: z.number(),
  /** Lines up with `killer_player_slot` in every player's death_details. */
  player_slot: z.number().optional(),
  team: z.string(),
  kills: z.number(),
  deaths: z.number(),
  assists: z.number(),
  net_worth: z.number(),
  last_hits: z.number(),
  denies: z.number(),
  player_level: z.number().optional(),
  accolades: z
    .array(z.object({ accolade_id: z.number(), accolade_stat_value: z.number() }))
    .default([]),
  death_details: z
    .array(
      z.object({
        game_time_s: z.number(),
        death_pos: z.array(z.number()).min(2),
        /** The slot that landed the kill; absent for some deaths. */
        killer_player_slot: z.number().optional(),
      }),
    )
    .default([]),
  final_stats: finalStats.optional(),
});
export type BulkPlayer = z.infer<typeof bulkPlayer>;

/** Who stood in which slot of one match, so a killer slot can be turned into a hero. */
export const matchLineup = z.object({
  match_id: z.number(),
  players: z.array(
    z.object({
      account_id: z.number().nullish(),
      player_slot: z.number(),
      hero_id: z.number(),
      team: z.string(),
    }),
  ),
});
export type MatchLineup = z.infer<typeof matchLineup>;

export const bulkMatch = z.object({
  match_id: z.number(),
  /** UTC, formatted "YYYY-MM-DD HH:MM:SS". */
  start_time: z.string(),
  duration_s: z.number(),
  game_mode: z.string(),
  match_mode: z.string(),
  winning_team: z.string(),
  mid_boss: z
    .array(
      z.object({
        team_killed: z.string(),
        team_claimed: z.string(),
        destroyed_time_s: z.number(),
      }),
    )
    .default([]),
  players: z.array(bulkPlayer),
});
export type BulkMatch = z.infer<typeof bulkMatch>;

export const quantiles = z.object({
  avg: z.number(),
  std: z.number(),
  percentile1: z.number(),
  percentile5: z.number(),
  percentile10: z.number(),
  percentile25: z.number(),
  percentile50: z.number(),
  percentile75: z.number(),
  percentile90: z.number(),
  percentile95: z.number(),
  percentile99: z.number(),
});
export type Quantiles = z.infer<typeof quantiles>;
export const statMetrics = z.record(z.string(), quantiles);
export type StatMetrics = z.infer<typeof statMetrics>;

export const steamProfile = z.object({
  account_id: z.number(),
  personaname: z.string(),
  profileurl: z.string().nullable().optional(),
  avatarfull: z.string().nullable().optional(),
});
export type SteamProfile = z.infer<typeof steamProfile>;

export const mmrHistoryEntry = z.object({
  match_id: z.number(),
  start_time: z.number(),
  rank: z.number(),
  division: z.number(),
  division_tier: z.number(),
});
export type MmrHistoryEntry = z.infer<typeof mmrHistoryEntry>;

/** One Deadlock changelog post from /v1/patches. `pub_date` is its last edit, not the patch date. */
export const patchEntry = z.object({ title: z.string(), pub_date: z.string() });
export type PatchEntry = z.infer<typeof patchEntry>;
