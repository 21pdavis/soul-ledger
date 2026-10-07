import {
  bigint,
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import type { MmrHistoryEntry } from "@/lib/deadlock-api/schemas";

// Account ids are 32-bit unsigned, so they overflow Postgres `integer`.
const accountId = () => bigint("account_id", { mode: "number" });

/** Everyone looked up on the site (ADR 0001). */
export const players = pgTable("players", {
  accountId: accountId().primaryKey(),
  personaName: text("persona_name"),
  avatarUrl: text("avatar_url"),
  profileUrl: text("profile_url"),
  rankHistory: jsonb("rank_history").$type<MmrHistoryEntry[]>().notNull().default([]),
  lastSyncedAt: timestamp("last_synced_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/** One row per player per match, flattened to the fields the story needs (see PlayerMatch). */
export const playerMatches = pgTable(
  "player_matches",
  {
    accountId: accountId().notNull(),
    matchId: bigint("match_id", { mode: "number" }).notNull(),
    startTime: timestamp("start_time", { withTimezone: true }).notNull(),
    durationS: integer("duration_s").notNull(),
    gameMode: text("game_mode").notNull(),
    matchMode: text("match_mode").notNull(),
    heroId: integer("hero_id").notNull(),
    won: boolean("won").notNull(),

    kills: integer("kills").notNull(),
    deaths: integer("deaths").notNull(),
    assists: integer("assists").notNull(),
    netWorth: integer("net_worth").notNull(),
    lastHits: integer("last_hits").notNull(),
    denies: integer("denies").notNull(),

    bulletKills: integer("bullet_kills").notNull(),
    abilityKills: integer("ability_kills").notNull(),
    meleeKills: integer("melee_kills").notNull(),
    headshotKills: integer("headshot_kills").notNull(),
    closeupKills: integer("closeup_kills").notNull(),
    longDistanceKills: integer("long_distance_kills").notNull(),

    shotsHit: integer("shots_hit").notNull(),
    shotsMissed: integer("shots_missed").notNull(),
    heroBulletsHit: integer("hero_bullets_hit").notNull(),
    heroBulletsHitCrit: integer("hero_bullets_hit_crit").notNull(),
    heroShots: integer("hero_shots").notNull(),
    heroHits: integer("hero_hits").notNull(),
    heroHeadshots: integer("hero_headshots").notNull(),
    parrySuccess: integer("parry_success").notNull(),
    parryMiss: integer("parry_miss").notNull(),
    unspentGoldMinutes: integer("unspent_gold_minutes").notNull(),

    breakables: integer("breakables").notNull(),
    sinnerJackpots: integer("sinner_jackpots").notNull(),
    idolsReturned: integer("idols_returned").notNull(),
    powerupsCollected: integer("powerups_collected").notNull(),

    playerDamage: integer("player_damage").notNull(),
    teammateHealing: integer("teammate_healing").notNull(),
    bossDamage: integer("boss_damage").notNull(),

    midBossClaimed: integer("mid_boss_claimed").notNull(),
    midBossStolen: integer("mid_boss_stolen").notNull(),

    deathPositions: jsonb("death_positions").$type<[number, number][]>().notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.accountId, t.matchId] }),
    // Squad mode finds shared matches by id.
    index("player_matches_match_id_idx").on(t.matchId),
  ],
);

/**
 * One row per player being fetched. The row doubles as a lock so concurrent lookups of the
 * same player share one fetch (ADR 0026).
 */
export const fetchJobs = pgTable("fetch_jobs", {
  accountId: accountId().primaryKey(),
  status: text("status", { enum: ["running", "done", "failed"] }).notNull(),
  startedAt: timestamp("started_at", { withTimezone: true }).notNull(),
  heartbeatAt: timestamp("heartbeat_at", { withTimezone: true }).notNull(),
  finishedAt: timestamp("finished_at", { withTimezone: true }),
  error: text("error"),
});

/** Cached API responses that are not per-player, such as global percentile metrics. */
export const apiCache = pgTable("api_cache", {
  key: text("key").primaryKey(),
  data: jsonb("data").notNull(),
  fetchedAt: timestamp("fetched_at", { withTimezone: true }).notNull(),
});
