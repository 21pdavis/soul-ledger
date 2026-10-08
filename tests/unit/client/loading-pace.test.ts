import { afterEach, describe, expect, it, vi } from "vitest";
import {
  LOADING_PACE,
  NO_PACE,
  PACE_OVERRIDE_KEY,
  createLoadingPacer,
  resolvePace,
  type PaceConfig,
} from "@/lib/client/loading-pace";
import { loadingStage } from "@/lib/client/loading-stage";
import type { ClientLookupEvent } from "@/lib/client/lookup-stream";
import { fixtureStory } from "../../fixtures/story";

// The pacer only changes WHEN real events are shown. It is driven by an explicit clock (the `now`
// passed to each call), so these tests need no fake timers.

const PACE: PaceConfig = { stageDwellMs: 1000, tallyCountMs: 500, finalTailMs: 400 };

const resolved: ClientLookupEvent = { type: "resolved", accountId: 1 };
const profile = (name = "Gaben"): ClientLookupEvent => ({
  type: "profile",
  accountId: 1,
  personaName: name,
  avatarUrl: null,
});
const history = (over: Record<string, unknown> = {}): ClientLookupEvent => ({
  type: "history",
  totalMatches: 120,
  newMatches: 120,
  heroIds: [1, 2],
  ...over,
});
const details = (fetched: number, total = 100): ClientLookupEvent => ({
  type: "details",
  fetched,
  total,
  kills: fetched * 8,
  breakables: fetched * 3,
  sinnerJackpots: 0,
});
const done: ClientLookupEvent = { type: "done", matchCount: 120 };
const waiting: ClientLookupEvent = { type: "waiting" };
const story = {
  type: "story",
  player: { accountId: 1, personaName: "Gaben", avatarUrl: null },
  window: "all",
  patchStart: null,
  stale: false,
  story: fixtureStory(),
} as ClientLookupEvent;
const failure: ClientLookupEvent = { type: "error", reason: "unavailable" };

const types = (shown: readonly ClientLookupEvent[]) => shown.map((e) => e.type);

describe("createLoadingPacer", () => {
  it("shows the first stage at once: there is nothing on screen to protect", () => {
    const pacer = createLoadingPacer(PACE);
    pacer.push(resolved, 0);
    expect(types(pacer.push(profile(), 5).shown)).toEqual(["resolved", "profile"]);
  });

  it("shows a burst of events one stage at a time, a dwell apart", () => {
    const pacer = createLoadingPacer(PACE);
    pacer.push(profile(), 0);
    pacer.push(history(), 1);
    pacer.push(details(100), 2);
    pacer.push(done, 3);

    expect(types(pacer.advance(999).shown)).toEqual(["profile"]);
    expect(types(pacer.advance(1000).shown)).toEqual(["profile", "history"]);
    expect(types(pacer.advance(1999).shown)).toEqual(["profile", "history"]);
    // The done event is not a stage: it is shown together with the stage before it.
    expect(types(pacer.advance(2000).shown)).toEqual(["profile", "history", "details", "done"]);
  });

  it("shows a slow event the moment it arrives once the dwell has passed", () => {
    const pacer = createLoadingPacer(PACE);
    pacer.push(profile(), 0);
    expect(types(pacer.push(history(), 5000).shown)).toEqual(["profile", "history"]);
    expect(pacer.advance(5000).wakeAt).toBeNull(); // nothing queued, nothing to wake for
  });

  it("holds the dwell from when a stage was SHOWN, not from when its event arrived", () => {
    const pacer = createLoadingPacer(PACE);
    pacer.push(profile(), 0);
    pacer.push(history(), 300); // queued until 1000
    pacer.push(details(10), 400);
    expect(types(pacer.advance(1000).shown)).toEqual(["profile", "history"]);
    // History went up at 1000, so details may not go up before 2000 even though it arrived long ago.
    expect(types(pacer.advance(1500).shown)).toEqual(["profile", "history"]);
    expect(types(pacer.advance(2000).shown)).toEqual(["profile", "history", "details"]);
  });

  it("never advances a stage on its own: with no events, time changes nothing", () => {
    const pacer = createLoadingPacer(PACE);
    expect(pacer.advance(0)).toMatchObject({ shown: [], final: null, wakeAt: null });
    expect(pacer.advance(1_000_000)).toMatchObject({ shown: [], final: null, wakeAt: null });
    pacer.push(profile(), 0);
    expect(types(pacer.advance(1_000_000).shown)).toEqual(["profile"]);
  });

  it("tells the caller when to look again, and stops asking once idle", () => {
    const pacer = createLoadingPacer(PACE);
    pacer.push(profile(), 0);
    expect(pacer.push(history(), 100).wakeAt).toBe(1000);
    expect(pacer.advance(1000).wakeAt).toBeNull();
  });

  describe("updates inside a stage already on screen", () => {
    it("shows later details events at once (the counters animate them)", () => {
      const pacer = createLoadingPacer(PACE);
      pacer.push(profile(), 0);
      pacer.push(history(), 1000);
      pacer.push(details(10), 2000);
      const out = pacer.push(details(60), 2100);
      expect(types(out.shown)).toEqual(["profile", "history", "details", "details"]);
      expect(loadingStage(out.shown).details?.fetched).toBe(60);
    });

    it("keeps only the latest details event while the first is still waiting its turn", () => {
      const pacer = createLoadingPacer(PACE);
      pacer.push(profile(), 0);
      pacer.push(history(), 1);
      for (const n of [10, 40, 70]) pacer.push(details(n), 2);
      pacer.advance(1000); // history goes up at 1000, details at 2000
      const out = pacer.advance(2000);
      expect(types(out.shown)).toEqual(["profile", "history", "details"]);
      expect(loadingStage(out.shown).details?.fetched).toBe(70);
    });

    it("a duplicate or late event for a stage already shown does not queue or delay anything", () => {
      const pacer = createLoadingPacer(PACE);
      pacer.push(profile(), 0);
      pacer.push(history(), 1);
      const out = pacer.push(profile("Gaben, again"), 2);
      expect(types(out.shown)).toEqual(["profile", "profile"]);
      expect(out.wakeAt).toBe(1000); // history is still due when it was
    });
  });

  describe("out-of-order events never take the loader backwards", () => {
    it("a profile that arrives after the history cannot pull the stage back", () => {
      const pacer = createLoadingPacer(PACE);
      pacer.push(history(), 0);
      const out = pacer.push(profile(), 1);
      expect(loadingStage(out.shown).stage).toBe(2);
      expect(loadingStage(out.shown).profile?.name).toBe("Gaben");
    });

    it("the stage on screen only ever goes up, whatever the arrival order", () => {
      const pacer = createLoadingPacer(PACE);
      const stages: number[] = [];
      const feed: [ClientLookupEvent, number][] = [
        [details(5), 0],
        [profile(), 3000],
        [resolved, 6000],
        [history(), 9000],
        [profile(), 12000],
        [details(9), 15000],
        [history(), 18000],
      ];
      for (const [event, at] of feed) {
        stages.push(loadingStage(pacer.push(event, at).shown).stage);
        for (const t of [at + 500, at + 1500, at + 2500]) {
          stages.push(loadingStage(pacer.advance(t).shown).stage);
        }
      }
      expect(stages).toEqual([...stages].sort((a, b) => a - b));
    });

    it("queues stages in order even if they arrive out of order", () => {
      const pacer = createLoadingPacer(PACE);
      pacer.push(profile(), 0); // up at 0
      pacer.push(details(5), 1);
      pacer.push(history(), 2); // arrives after details but is an earlier stage
      expect(types(pacer.advance(1000).shown)).toEqual(["profile", "history"]);
      expect(types(pacer.advance(2000).shown)).toEqual(["profile", "history", "details"]);
    });

    it("never lets the counters tick backwards in the queue", () => {
      const pacer = createLoadingPacer(PACE);
      pacer.push(profile(), 0);
      pacer.push(history(), 1);
      pacer.push(details(70), 2);
      pacer.push(details(30), 3); // out of order
      pacer.advance(1000);
      expect(loadingStage(pacer.advance(2000).shown).details?.fetched).toBe(70);
    });
  });

  describe("waiting and errors", () => {
    it("shows a waiting event at once, even mid-dwell", () => {
      const pacer = createLoadingPacer(PACE);
      pacer.push(profile(), 0);
      pacer.push(history(), 1);
      const out = pacer.push(waiting, 2);
      expect(types(out.shown)).toEqual(["profile", "waiting"]);
      expect(loadingStage(out.shown).waiting).toBe(true);
    });

    it("releases an error at once, without dwell, and drops what was queued", () => {
      const pacer = createLoadingPacer(PACE);
      pacer.push(profile(), 0);
      pacer.push(history(), 1);
      const out = pacer.push(failure, 2);
      expect(out.final).toBe(failure);
      expect(types(out.shown)).toEqual(["profile"]);
      expect(pacer.advance(10_000).shown).toHaveLength(1);
    });

    it("releases an error that arrives before anything was shown", () => {
      expect(createLoadingPacer(PACE).push(failure, 0).final).toBe(failure);
    });
  });

  describe("releasing the story", () => {
    it("holds the story until the last stage has had its dwell plus the tail", () => {
      const pacer = createLoadingPacer(PACE);
      pacer.push(profile(), 0);
      pacer.push(history(), 1);
      pacer.push(details(100), 2);
      pacer.push(done, 3);
      pacer.push(story, 4);
      // details goes up at 2000; it gets 1000 of dwell and then the 400 tail.
      pacer.advance(1000);
      pacer.advance(2000);
      expect(pacer.advance(3399).final).toBeNull();
      expect(pacer.advance(3400).final).toBe(story);
    });

    it("keeps showing every queued stage before the story, however early it arrived", () => {
      const pacer = createLoadingPacer(PACE);
      pacer.push(profile(), 0);
      pacer.push(history(), 1);
      pacer.push(story, 2);
      pacer.advance(1000);
      const mid = pacer.advance(1999);
      expect(mid.final).toBeNull();
      expect(types(mid.shown)).toEqual(["profile", "history"]);
      expect(pacer.advance(2400).final).toBe(story);
    });

    it("tells the caller when the story will be released", () => {
      const pacer = createLoadingPacer(PACE);
      pacer.push(profile(), 0);
      expect(pacer.push(story, 10).wakeAt).toBe(1400);
    });

    it("adds nothing when the real lookup was slower than the dwell and tail", () => {
      const pacer = createLoadingPacer(PACE);
      pacer.push(profile(), 0);
      pacer.push(history(), 8000);
      pacer.push(details(100), 16_000);
      expect(pacer.push(story, 30_000).final).toBe(story);
    });

    it("releases a story at once if nothing was ever shown (no stage to read)", () => {
      const pacer = createLoadingPacer(PACE);
      pacer.push(resolved, 0);
      expect(pacer.push(story, 5).final).toBe(story);
    });

    it("ignores everything after the final event", () => {
      const pacer = createLoadingPacer(PACE);
      pacer.push(story, 0);
      const out = pacer.push(profile(), 1);
      expect(out.shown).toEqual([]);
      expect(out.final).toBe(story);
    });
  });

  describe("pacing off", () => {
    it("shows everything at once and releases the story immediately", () => {
      const pacer = createLoadingPacer(NO_PACE);
      for (const e of [profile(), history(), details(100), done]) pacer.push(e, 0);
      const out = pacer.push(story, 0);
      expect(types(out.shown)).toEqual(["profile", "history", "details", "done"]);
      expect(out.final).toBe(story);
    });
  });

  describe("with the real constants", () => {
    /** Feeds `events` at their times, wakes the pacer when asked, returns when the story is out. */
    function releasedAt(events: [ClientLookupEvent, number][]): number {
      const pacer = createLoadingPacer(LOADING_PACE);
      let wake: number | null = null;
      let clock = 0;
      for (const [event, at] of events) {
        while (wake !== null && wake <= at) {
          clock = wake;
          const out = pacer.advance(clock);
          if (out.final) return clock;
          wake = out.wakeAt;
        }
        clock = at;
        const out = pacer.push(event, at);
        if (out.final) return clock;
        wake = out.wakeAt;
      }
      for (let i = 0; i < 20 && wake !== null; i++) {
        clock = wake;
        const out = pacer.advance(clock);
        if (out.final) return clock;
        wake = out.wakeAt;
      }
      throw new Error("the story was never released");
    }

    it("a fully cached lookup takes about four to five seconds", () => {
      // resolved, profile, history (nothing new), done and the story all within ~100 ms.
      const total = releasedAt([
        [resolved, 20],
        [profile(), 40],
        [history({ newMatches: 0 }), 60],
        [done, 80],
        [story, 100],
      ]);
      expect(total).toBeGreaterThanOrEqual(3500);
      expect(total).toBeLessThanOrEqual(5500);
    });

    it("a slow lookup gets no extra delay on top of its real events", () => {
      const total = releasedAt([
        [resolved, 6000],
        [profile(), 900],
        [history(), 4000],
        [details(10), 7000],
        [details(100), 20_000],
        [done, 20_050],
        [story, 20_100],
      ]);
      expect(total).toBe(20_100);
    });

    it("gives the player time to read: each stage is at least a second on screen", () => {
      expect(LOADING_PACE.stageDwellMs).toBeGreaterThanOrEqual(1000);
      expect(LOADING_PACE.tallyCountMs).toBeGreaterThanOrEqual(1000);
      expect(LOADING_PACE.finalTailMs).toBeGreaterThanOrEqual(500);
    });
  });
});

describe("resolvePace", () => {
  afterEach(() => vi.unstubAllGlobals());
  const stubStorage = (value: string | null) =>
    vi.stubGlobal("localStorage", {
      getItem: (key: string) => (key === PACE_OVERRIDE_KEY ? value : null),
    });

  it("is the real pacing by default (and on the server, where there is no storage)", () => {
    expect(resolvePace()).toBe(LOADING_PACE);
    stubStorage(null);
    expect(resolvePace()).toBe(LOADING_PACE);
  });

  it("can only be switched off, never made slower", () => {
    stubStorage("off");
    expect(resolvePace()).toBe(NO_PACE);
    stubStorage("slow");
    expect(resolvePace()).toBe(LOADING_PACE);
    stubStorage("999999");
    expect(resolvePace()).toBe(LOADING_PACE);
  });

  it("falls back to the real pacing when storage throws", () => {
    vi.stubGlobal("localStorage", {
      getItem: () => {
        throw new DOMException("denied", "SecurityError");
      },
    });
    expect(resolvePace()).toBe(LOADING_PACE);
  });
});
