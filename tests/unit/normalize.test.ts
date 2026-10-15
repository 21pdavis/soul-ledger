import { describe, expect, it } from "vitest";
import { bulkMatch, matchLineup, type BulkMatch } from "@/lib/deadlock-api/schemas";
import { normalizePlayerMatch, tagKillers } from "@/lib/stats/normalize";
import type { DeathPoint } from "@/lib/stats/types";
import { fixtureJson, TEST_ACCOUNT_ID } from "../helpers/fixtures";

const matches = bulkMatch.array().parse(fixtureJson("api/bulk-metadata.json"));
const lineups = matchLineup.array().parse(fixtureJson("api/lineups.json"));
const lineupOf = (id: number) => lineups.find((l) => l.match_id === id)!;
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

  describe("tagKillers (the nemesis data)", () => {
    // Recorded: the killer slots are 4, 4, 4, 5, 1, 1, 2 and the lineup maps them to heroes.
    const plain = (id: number): DeathPoint[] =>
      normalizePlayerMatch(byId(id), TEST_ACCOUNT_ID).deathPositions;

    it("starts a stored row as plain [x, y] deaths", () => {
      expect(plain(111236243).every((d) => d.length === 2)).toBe(true);
    });

    it("tags each death with the hero that killed the player", () => {
      const tagged = tagKillers(plain(111236243), TEST_ACCOUNT_ID, lineupOf(111236243));
      expect(tagged).toHaveLength(7);
      expect(tagged!.map((d) => d[2])).toEqual([4, 4, 4, 12, 18, 18, 27]);
      expect(tagged![0].slice(0, 2)).toEqual(plain(111236243)[0]);
    });

    it("marks a death 0 (read, but no enemy killer) when the killer is a teammate, self or unknown", () => {
      const lineup = lineupOf(111236243);
      const me = lineup.players.find((p) => p.account_id === TEST_ACCOUNT_ID)!;
      const mate = lineup.players.find(
        (p) => p.team === me.team && p.player_slot !== me.player_slot,
      )!;
      const enemy = lineup.players.find((p) => p.team !== me.team)!;
      const slots = [me.player_slot, mate.player_slot, null, 99, enemy.player_slot];
      const edited = {
        ...lineup,
        players: lineup.players.map((p) =>
          p === me ? { ...p, death_details: slots.map((k) => ({ killer_player_slot: k })) } : p,
        ),
      };
      const tagged = tagKillers(plain(111236243).slice(0, 5), TEST_ACCOUNT_ID, edited);
      expect(tagged!.map((d) => d[2])).toEqual([0, 0, 0, 0, enemy.hero_id]);
    });

    it("still tags the row when no death has an enemy killer, so it is never asked about again", () => {
      const lineup = lineupOf(111236243);
      const noEnemy = {
        ...lineup,
        players: lineup.players.map((p) =>
          p.account_id === TEST_ACCOUNT_ID
            ? { ...p, death_details: p.death_details.map(() => ({ killer_player_slot: null })) }
            : p,
        ),
      };
      const tagged = tagKillers(plain(111236243), TEST_ACCOUNT_ID, noEnemy);
      expect(tagged!.map((d) => d[2])).toEqual([0, 0, 0, 0, 0, 0, 0]);
    });

    it("returns null when the lineup cannot be read (so the row is not rewritten)", () => {
      const lineup = lineupOf(111236243);
      expect(tagKillers(plain(111236243), 1, lineup)).toBeNull();
      const bare = { ...lineup, players: lineup.players.map((p) => ({ ...p, death_details: [] })) };
      expect(tagKillers(plain(111236243), TEST_ACCOUNT_ID, bare)).toBeNull();
    });

    it("refuses to guess when the lineup lists a different number of deaths", () => {
      expect(
        tagKillers(plain(111236243).slice(0, 3), TEST_ACCOUNT_ID, lineupOf(111236243)),
      ).toBeNull();
    });
  });
});
