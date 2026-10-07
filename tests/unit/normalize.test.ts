import { describe, expect, it } from "vitest";
import { bulkMatch, type BulkMatch } from "@/lib/deadlock-api/schemas";
import { normalizePlayerMatch } from "@/lib/stats/normalize";
import { fixtureJson, TEST_ACCOUNT_ID } from "../helpers/fixtures";

const matches = bulkMatch.array().parse(fixtureJson("api/bulk-metadata.json"));
const byId = (id: number) => matches.find((m) => m.match_id === id)!;

describe("normalizePlayerMatch", () => {
  it("flattens the newest recorded match", () => {
    const row = normalizePlayerMatch(byId(112055054), TEST_ACCOUNT_ID);
    expect(row).toMatchObject({
      accountId: TEST_ACCOUNT_ID,
      matchId: 112055054,
      startTime: new Date("2026-10-06T21:35:39Z"),
      durationS: 1671,
      gameMode: "normal",
      matchMode: "unranked",
      heroId: 8,
      won: true,
      kills: 6,
      deaths: 1,
      assists: 13,
      netWorth: 33443,
      lastHits: 142,
      denies: 3,
      bulletKills: 2,
      abilityKills: 2,
      meleeKills: 0,
      headshotKills: 0,
      shotsHit: 2272,
      shotsMissed: 1234,
      heroBulletsHit: 581,
      heroBulletsHitCrit: 59,
      heroShots: 1805,
      heroHits: 581,
      heroHeadshots: 59,
      parrySuccess: 12,
      parryMiss: 2,
      unspentGoldMinutes: 54556,
      breakables: 84,
      sinnerJackpots: 3,
      idolsReturned: 0,
      powerupsCollected: 11,
      closeupKills: 0,
      longDistanceKills: 2,
      playerDamage: 29250,
      teammateHealing: 2288,
      bossDamage: 11796,
      midBossClaimed: 0,
      midBossStolen: 0,
    });
    expect(row.deathPositions).toEqual([[-1815.375, -2111.3125]]);
  });

  it("marks Street Brawl matches so stats can filter them out", () => {
    const brawl = matches.find((m) => m.game_mode === "StreetBrawl")!;
    expect(normalizePlayerMatch(brawl, TEST_ACCOUNT_ID).gameMode).toBe("street_brawl");
  });

  it("counts a lost match", () => {
    const lost = matches.find((m) => m.winning_team !== m.players[0].team)!;
    expect(normalizePlayerMatch(lost, TEST_ACCOUNT_ID).won).toBe(false);
  });

  it("counts idols returned when the accolade is present", () => {
    const urn = matches.find((m) => m.players[0].accolades.some((a) => a.accolade_id === 13))!;
    expect(normalizePlayerMatch(urn, TEST_ACCOUNT_ID).idolsReturned).toBeGreaterThan(0);
  });

  it("counts Rejuvenators claimed by the player's team, and steals", () => {
    const base = byId(112055054);
    const match: BulkMatch = {
      ...base,
      mid_boss: [
        { team_killed: "Team1", team_claimed: "Team1", destroyed_time_s: 900 },
        { team_killed: "Team0", team_claimed: "Team1", destroyed_time_s: 1300 },
        { team_killed: "Team0", team_claimed: "Team0", destroyed_time_s: 1600 },
      ],
    };
    expect(normalizePlayerMatch(match, TEST_ACCOUNT_ID)).toMatchObject({
      midBossClaimed: 2,
      midBossStolen: 1,
    });
  });

  it("treats missing final stats as zeros", () => {
    const base = byId(112055054);
    const match: BulkMatch = {
      ...base,
      players: [{ ...base.players[0], final_stats: undefined, accolades: [], death_details: [] }],
    };
    expect(normalizePlayerMatch(match, TEST_ACCOUNT_ID)).toMatchObject({
      kills: 6,
      heroShots: 0,
      breakables: 0,
      deathPositions: [],
    });
  });

  it("throws when the player is not in the match", () => {
    expect(() => normalizePlayerMatch(byId(112055054), 1)).toThrow(/not in match/);
  });
});
