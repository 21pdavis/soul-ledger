import { describe, expect, it } from "vitest";
import type { ClientLookupEvent } from "@/lib/client/lookup-stream";
import { loadingStage } from "@/lib/client/loading-stage";

const resolved: ClientLookupEvent = { type: "resolved", accountId: 1 };
const profile = (over: Record<string, unknown> = {}): ClientLookupEvent => ({
  type: "profile",
  accountId: 1,
  personaName: "Gaben",
  avatarUrl: "https://avatars.example/g.jpg",
  ...over,
});
const history = (over: Record<string, unknown> = {}): ClientLookupEvent => ({
  type: "history",
  totalMatches: 120,
  newMatches: 120,
  heroIds: [1, 2, 18],
  ...over,
});
const details = (fetched: number, total = 100, over: Record<string, unknown> = {}) =>
  ({
    type: "details",
    fetched,
    total,
    kills: fetched * 8,
    breakables: fetched * 3,
    sinnerJackpots: 1,
    ...over,
  }) as ClientLookupEvent;
const waiting: ClientLookupEvent = { type: "waiting" };
const done: ClientLookupEvent = { type: "done", matchCount: 120 };

describe("loadingStage", () => {
  it("is stage 0 with nothing to show before any event", () => {
    const view = loadingStage([]);
    expect(view.stage).toBe(0);
    expect(view.profile).toBeNull();
    expect(view.history).toBeNull();
    expect(view.details).toBeNull();
    expect(view.waiting).toBe(false);
    expect(view.announcement).toMatch(/looking up/i);
  });

  it("stays at stage 0 after only the resolved event", () => {
    const view = loadingStage([resolved]);
    expect(view.stage).toBe(0);
    expect(view.profile).toBeNull();
  });

  it("stage 1: the profile brings the avatar and persona name", () => {
    const view = loadingStage([resolved, profile()]);
    expect(view.stage).toBe(1);
    expect(view.profile).toEqual({ name: "Gaben", avatarUrl: "https://avatars.example/g.jpg" });
    expect(view.history).toBeNull();
    expect(view.announcement).toContain("Gaben");
  });

  it("stage 1 copes with a profile that has no name or avatar", () => {
    const view = loadingStage([profile({ personaName: null, avatarUrl: null })]);
    expect(view.stage).toBe(1);
    expect(view.profile).toEqual({ name: null, avatarUrl: null });
    expect(view.announcement).not.toMatch(/null/);
  });

  it("stage 2: history brings the match count and hero tiles with names and monograms", () => {
    const view = loadingStage([resolved, profile(), history()]);
    expect(view.stage).toBe(2);
    expect(view.history?.totalMatches).toBe(120);
    expect(view.history?.heroes).toEqual([
      { id: 1, name: "Infernus", monogram: "I" },
      { id: 2, name: "Seven", monogram: "S" },
      { id: 18, name: "Mo & Krill", monogram: "MK" },
    ]);
  });

  it("lists each hero once, in first-seen order", () => {
    const view = loadingStage([history({ heroIds: [2, 1, 2, 1, 7] })]);
    expect(view.history?.heroes.map((h) => h.id)).toEqual([2, 1, 7]);
  });

  describe("history wording", () => {
    const summary = (total: number, added: number) =>
      loadingStage([history({ totalMatches: total, newMatches: added })]).history?.summary;

    it("a first look says the matches were found", () => {
      expect(summary(120, 120)).toBe("120 matches on the books");
    });
    it("a return visit with nothing new says they are already in the ledger", () => {
      expect(summary(120, 0)).toBe("120 matches, all already in the ledger");
    });
    it("a partial update says how many are new", () => {
      expect(summary(120, 14)).toBe("120 matches, 14 new to the ledger");
    });
    it("uses the singular for one match", () => {
      expect(summary(1, 1)).toBe("1 match on the books");
    });
    it("handles an empty history without claiming matches", () => {
      expect(summary(0, 0)).toBe("No matches on the books yet");
    });
    it("groups thousands", () => {
      expect(summary(1500, 1500)).toBe("1,500 matches on the books");
    });
  });

  it("stage 3: details give fetched/total counters, a fraction and the running tallies", () => {
    const view = loadingStage([resolved, profile(), history(), details(25)]);
    expect(view.stage).toBe(3);
    expect(view.details).toEqual({
      fetched: 25,
      total: 100,
      fraction: 0.25,
      complete: false,
      kills: 200,
      breakables: 75,
      sinnerJackpots: 1,
    });
  });

  it("keeps the latest details as they tick up", () => {
    const view = loadingStage([profile(), history(), details(25), details(50), details(75)]);
    expect(view.details?.fetched).toBe(75);
    expect(view.details?.fraction).toBe(0.75);
  });

  it("marks the details complete when everything is fetched", () => {
    const view = loadingStage([profile(), history(), details(100)]);
    expect(view.details?.complete).toBe(true);
    expect(view.details?.fraction).toBe(1);
  });

  it("treats details with a total of 0 as nothing to fetch, not a divide by zero", () => {
    const view = loadingStage([history({ newMatches: 0 }), details(0, 0)]);
    expect(view.stage).toBe(3);
    expect(view.details?.fraction).toBe(1);
    expect(view.details?.complete).toBe(true);
    expect(Number.isNaN(view.details?.fraction)).toBe(false);
  });

  it("never lets the fraction pass 1", () => {
    expect(loadingStage([details(120, 100)]).details?.fraction).toBe(1);
  });

  describe("waiting", () => {
    it("shows a waiting state without touching the stage or the data", () => {
      const view = loadingStage([resolved, waiting]);
      expect(view.waiting).toBe(true);
      expect(view.stage).toBe(0);
      expect(view.announcement).toMatch(/waiting/i);
    });

    it("keeps the stage reached when waiting arrives later", () => {
      const view = loadingStage([profile(), history(), waiting]);
      expect(view.waiting).toBe(true);
      expect(view.stage).toBe(2);
      expect(view.history?.totalMatches).toBe(120);
      expect(view.profile?.name).toBe("Gaben");
    });

    it("clears once the next real event arrives", () => {
      const view = loadingStage([resolved, waiting, profile()]);
      expect(view.waiting).toBe(false);
      expect(view.stage).toBe(1);
    });

    it("does not clear on a repeated waiting event", () => {
      expect(loadingStage([waiting, waiting]).waiting).toBe(true);
    });
  });

  describe("out-of-order and duplicate events", () => {
    it("never moves back a stage when an earlier event repeats", () => {
      const view = loadingStage([profile(), history(), details(10), profile({ personaName: "G" })]);
      expect(view.stage).toBe(3);
      expect(view.profile?.name).toBe("G");
      expect(view.history?.totalMatches).toBe(120);
    });

    it("shows later stages that arrive before earlier ones", () => {
      const view = loadingStage([history(), details(10)]);
      expect(view.stage).toBe(3);
      expect(view.profile).toBeNull();
    });

    it("never ticks the counters backwards", () => {
      const view = loadingStage([details(50), details(30)]);
      expect(view.details?.fetched).toBe(50);
    });

    it("ignores duplicated resolved events", () => {
      expect(loadingStage([resolved, resolved]).stage).toBe(0);
    });
  });

  it("reports done, and announces that the ledger is being sealed", () => {
    const view = loadingStage([profile(), history(), details(100), done]);
    expect(view.done).toBe(true);
    expect(view.stage).toBe(3);
    expect(view.announcement).toMatch(/almost|sealing|ready/i);
  });

  it("does not announce counter ticks: only stage changes change the announcement", () => {
    const a = loadingStage([profile(), history(), details(10)]).announcement;
    const b = loadingStage([profile(), history(), details(60)]).announcement;
    expect(a).toBe(b);
    expect(loadingStage([profile(), history()]).announcement).not.toBe(a);
  });

  it("ignores final events defensively", () => {
    const view = loadingStage([
      profile(),
      { type: "error", reason: "unavailable" } as ClientLookupEvent,
    ]);
    expect(view.stage).toBe(1);
  });
});
