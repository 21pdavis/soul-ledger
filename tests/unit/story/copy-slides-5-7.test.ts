import { describe, expect, it } from "vitest";
import { PARRY_KING_RATE } from "@/lib/stats/story";
import {
  killsLead,
  midBossCopy,
  parryCopy,
  parryKingLine,
  rangeLine,
} from "@/story/copy-slides-5-7";

const kills = { total: 1500, bullet: 900, ability: 400, melee: 100, headshot: 300 };

describe("killsLead", () => {
  it("names the kind of kill that leads", () => {
    const lines = new Set([
      killsLead(kills),
      killsLead({ ...kills, bullet: 1 }),
      killsLead({ ...kills, bullet: 1, ability: 1 }),
    ]);
    expect(lines.size).toBe(3);
  });
  it("has friendly copy for no kills", () => {
    expect(killsLead({ ...kills, bullet: 0, ability: 0, melee: 0 })).toMatch(/no kills/i);
  });
});

describe("rangeLine", () => {
  it("differs for close-up, long-distance and even", () => {
    const lines = new Set([rangeLine(700, 300), rangeLine(300, 700), rangeLine(5, 5)]);
    expect(lines.size).toBe(3);
    expect(lines).not.toContain(null);
  });
  it("is null when there are no ranged kills", () => {
    expect(rangeLine(0, 0)).toBeNull();
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
  it("counts claimed Rejuvenators with the right plural", () => {
    expect(midBossCopy({ claimed: 1, stolen: 0 }).lead).toBe("Rejuvenator claimed");
    expect(midBossCopy({ claimed: 12, stolen: 0 }).lead).toBe("Rejuvenators claimed");
  });
  it("picks a different line for few, some and many", () => {
    const lines = new Set([2, 8, 40].map((claimed) => midBossCopy({ claimed, stolen: 0 }).line));
    expect(lines.size).toBe(3);
  });
  it("only has a stolen line when stolen is above 0", () => {
    expect(midBossCopy({ claimed: 12, stolen: 0 }).stolen).toBeNull();
    expect(midBossCopy({ claimed: 12, stolen: 2 }).stolen).toContain("2");
  });
});
