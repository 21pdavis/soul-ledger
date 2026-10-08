import { describe, expect, it } from "vitest";
import { createLoadingPacer, NO_PACE, LOADING_PACE } from "@/lib/client/loading-pace";
import { loadingStage } from "@/lib/client/loading-stage";
import type { ClientLookupEvent } from "@/lib/client/lookup-stream";

const resolved: ClientLookupEvent = { type: "resolved", accountId: 1 };
const status = (over: Record<string, unknown>) =>
  ({ type: "status", ...over }) as unknown as ClientLookupEvent;
const profile: ClientLookupEvent = {
  type: "profile",
  accountId: 1,
  personaName: "Gaben",
  avatarUrl: null,
};
const history: ClientLookupEvent = {
  type: "history",
  totalMatches: 500,
  newMatches: 500,
  heroIds: [1],
};

describe("loadingStage note (never a blank screen)", () => {
  it("always has a visible note, at every stage", () => {
    const stages: ClientLookupEvent[][] = [
      [],
      [resolved],
      [resolved, profile],
      [resolved, profile, history],
    ];
    for (const progress of stages) {
      expect(loadingStage(progress).note.length).toBeGreaterThan(0);
    }
  });

  it("names what it is doing while contacting the API", () => {
    const view = loadingStage([resolved, status({ step: "contacting" })]);
    expect(view.note).toMatch(/contacting deadlock/i);
  });

  it("says how many matches are left while reading a batch", () => {
    const view = loadingStage([
      resolved,
      profile,
      history,
      status({ step: "batch", fetched: 200, total: 500 }),
    ]);
    expect(view.note).toMatch(/300 matches left/);
  });

  it("tells the player about a rate limit wait", () => {
    const view = loadingStage([
      resolved,
      profile,
      history,
      status({ step: "rate_limited", waitMs: 12_000 }),
    ]);
    expect(view.note).toMatch(/waiting in line/i);
    expect(view.note).toMatch(/12 seconds/);
  });

  it("drops a status once a later stage event arrives", () => {
    const view = loadingStage([resolved, status({ step: "contacting" }), profile]);
    expect(view.note).not.toMatch(/contacting/i);
    expect(view.note.length).toBeGreaterThan(0);
  });
});

describe("pacer and status events", () => {
  it("shows a status at once, even while a stage is being held", () => {
    const pacer = createLoadingPacer(LOADING_PACE);
    pacer.push(profile, 0);
    pacer.push(history, 10); // queued behind the profile's dwell
    const out = pacer.push(status({ step: "batch", fetched: 0, total: 5 }), 20);
    expect(out.shown.map((e) => e.type)).toContain("status");
  });

  it("shows a status with no pacing too", () => {
    const pacer = createLoadingPacer(NO_PACE);
    const out = pacer.push(status({ step: "contacting" }), 0);
    expect(out.shown).toHaveLength(1);
  });
});
