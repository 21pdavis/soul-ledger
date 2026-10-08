import { describe, expect, it } from "vitest";
import { killRows, leadKillType, parryRate, rangeShares, share } from "@/story/kill-shares";

const kills = {
  total: 1500,
  bullet: 900,
  ability: 400,
  melee: 100,
  headshot: 300,
  closeup: 700,
  longDistance: 300,
};

describe("share", () => {
  it("is part over whole", () => {
    expect(share(25, 100)).toBe(0.25);
  });
  it("is 0, never NaN or Infinity, when the whole is 0", () => {
    expect(share(0, 0)).toBe(0);
    expect(share(5, 0)).toBe(0);
  });
  it("stays within 0 and 1", () => {
    expect(share(150, 100)).toBe(1);
    expect(share(-5, 100)).toBe(0);
  });
  it("is 0 for a bad number", () => {
    expect(share(Number.NaN, 100)).toBe(0);
  });
});

describe("killRows", () => {
  it("lists bullet, ability, melee and headshot with their share of all kills", () => {
    expect(killRows(kills)).toEqual([
      { key: "bullet", count: 900, share: 0.6 },
      { key: "ability", count: 400, share: 400 / 1500 },
      { key: "melee", count: 100, share: 100 / 1500 },
      { key: "headshot", count: 300, share: 0.2 },
    ]);
  });
  it("gives every row a share of 0 when there are no kills", () => {
    const rows = killRows({ ...kills, total: 0, bullet: 0, ability: 0, melee: 0, headshot: 0 });
    expect(rows.map((r) => r.share)).toEqual([0, 0, 0, 0]);
  });
});

describe("rangeShares", () => {
  it("splits close-up and long-distance kills between them", () => {
    expect(rangeShares(700, 300)).toEqual({ closeup: 0.7, longDistance: 0.3 });
  });
  it("is 0 and 0 with no ranged kills", () => {
    expect(rangeShares(0, 0)).toEqual({ closeup: 0, longDistance: 0 });
  });
});

describe("leadKillType", () => {
  it("is the biggest of bullet, ability and melee", () => {
    expect(leadKillType(kills)).toBe("bullet");
    expect(leadKillType({ ...kills, bullet: 10 })).toBe("ability");
    expect(leadKillType({ ...kills, bullet: 10, ability: 5 })).toBe("melee");
  });
  it("prefers bullet, then ability, on a tie", () => {
    expect(leadKillType({ ...kills, bullet: 5, ability: 5, melee: 5 })).toBe("bullet");
  });
  it("is null with no kills", () => {
    expect(leadKillType({ ...kills, bullet: 0, ability: 0, melee: 0 })).toBeNull();
  });
});

describe("parryRate", () => {
  it("is landed over tried", () => {
    expect(parryRate({ parrySuccess: 30, parryMiss: 20 })).toBe(0.6);
  });
  it("is 0 with no parries at all", () => {
    expect(parryRate({ parrySuccess: 0, parryMiss: 0 })).toBe(0);
  });
});
