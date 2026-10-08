import { describe, expect, it } from "vitest";
import { PARRY_KING_RATE } from "@/lib/stats/story";
import { killsTotalLabel, midBossCopy, parryCopy, parryKingLine } from "@/story/copy-slides-5-7";

describe("killsTotalLabel", () => {
  it("pluralises, so one kill never reads '1 kills'", () => {
    expect(killsTotalLabel(1)).toBe("kill on the ledger");
    expect(killsTotalLabel(0)).toBe("kills on the ledger");
    expect(killsTotalLabel(1500)).toBe("kills on the ledger");
  });
});

describe("parryKingLine", () => {
  it("is pinned to PARRY_KING_RATE (60% today, ADR 0040)", () => {
    expect(parryKingLine()).toContain(`${Math.round(PARRY_KING_RATE * 100)}%`);
    expect(parryKingLine()).toContain("60%");
  });
});

describe("parryCopy", () => {
  const precision = { heroAccuracy: 0.4, headshotRate: 0.2 };
  it("gives king and clown distinct badges and lines, with the counts", () => {
    const king = parryCopy({ ...precision, parrySuccess: 30, parryMiss: 20, parryLabel: "king" });
    const clown = parryCopy({ ...precision, parrySuccess: 10, parryMiss: 40, parryLabel: "clown" });
    expect(king.badge).toMatch(/king/i);
    expect(clown.badge).toMatch(/clown/i);
    expect(king.line).not.toBe(clown.line);
    expect(king.detail).toContain("30");
    expect(king.detail).toContain("20");
    expect(clown.detail).toContain("10");
    expect(clown.detail).toContain("40");
  });
  it("is neutral with no badge when the label is none", () => {
    const none = parryCopy({ ...precision, parrySuccess: 0, parryMiss: 7, parryLabel: "none" });
    expect(none.badge).toBeNull();
    expect(none.detail).toBeNull();
    expect(none.line).toMatch(/no parries/i);
  });
});

describe("midBossCopy", () => {
  it("has friendly in-voice copy, not a number, for 0 claimed", () => {
    const c = midBossCopy({ claimed: 0, stolen: 0 });
    expect(c.lead).toMatch(/no rejuvenators/i);
    expect(c.line.length).toBeGreaterThan(10);
  });
  it("counts claimed Rejuvenators as your team's, with the right plural", () => {
    expect(midBossCopy({ claimed: 1, stolen: 0 }).lead).toBe("Rejuvenator claimed by your team");
    expect(midBossCopy({ claimed: 12, stolen: 0 }).lead).toBe("Rejuvenators claimed by your team");
  });
  it("uses one fixed line however many were claimed (ADR 0053: no data-driven variants here)", () => {
    const lines = new Set([2, 8, 40].map((claimed) => midBossCopy({ claimed, stolen: 0 }).line));
    expect(lines.size).toBe(1);
  });
  it("only has a stolen line when stolen is above 0, and says it was your team", () => {
    expect(midBossCopy({ claimed: 12, stolen: 0 }).stolen).toBeNull();
    const stolen = midBossCopy({ claimed: 12, stolen: 2 }).stolen;
    expect(stolen).toContain("2");
    expect(stolen).toMatch(/your team/i);
  });
  it("never shows a steal when nothing was claimed (stolen is a subset of claimed)", () => {
    expect(midBossCopy({ claimed: 0, stolen: 3 }).stolen).toBeNull();
  });
});
