import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { Db } from "@/db";
import * as repo from "@/db/repository";
import { SHARE_TTL_MS, type SharedSnapshot } from "@/lib/share/types";
import { createTestDb } from "../helpers/db";

let db: Db;
let close: () => Promise<void>;

beforeEach(async () => {
  ({ db, close } = await createTestDb());
});
afterEach(() => close());

const NOW = new Date("2026-11-11T12:00:00Z");
const DAY = 24 * 60 * 60 * 1000;

function snapshot(accountId = 1): SharedSnapshot {
  return {
    version: 1,
    sharedAt: NOW.toISOString(),
    player: { accountId, personaName: "Haze Main", avatarUrl: null },
    meta: { window: "all", patchStart: null, patchUnavailable: false },
    // The story's shape is checked by its own tests; storage only round-trips it.
    story: { matchCount: 3 } as unknown as SharedSnapshot["story"],
  };
}

async function create(slug: string, contentHash: string, now = NOW, accountId = 1) {
  return repo.createSharedStory(db, {
    slug,
    accountId,
    contentHash,
    snapshot: snapshot(accountId),
    now,
  });
}

describe("shared stories", () => {
  it("expires links after 90 days", () => {
    expect(SHARE_TTL_MS).toBe(90 * DAY);
  });

  it("round-trips a snapshot by its slug, with an expiry 90 days out", async () => {
    await create("hazemain-ab12cd34", "h1");
    const row = await repo.getSharedStory(db, "hazemain-ab12cd34");
    expect(row).not.toBeNull();
    expect(row!.snapshot).toEqual(snapshot());
    expect(row!.accountId).toBe(1);
    expect(row!.createdAt).toEqual(NOW);
    expect(row!.expiresAt).toEqual(new Date(NOW.getTime() + SHARE_TTL_MS));
  });

  it("returns null for an unknown slug", async () => {
    expect(await repo.getSharedStory(db, "nope")).toBeNull();
  });

  it("still returns an expired row, so the page can offer the live story", async () => {
    await create("old-ab12cd34", "h1", new Date(NOW.getTime() - 100 * DAY));
    const row = await repo.getSharedStory(db, "old-ab12cd34");
    expect(row).not.toBeNull();
    expect(repo.isSharedStoryExpired(row!, NOW)).toBe(true);
  });

  it("treats a link as live until the moment it expires", async () => {
    await create("x-ab12cd34", "h1");
    const row = (await repo.getSharedStory(db, "x-ab12cd34"))!;
    expect(repo.isSharedStoryExpired(row, new Date(row.expiresAt.getTime() - 1))).toBe(false);
    expect(repo.isSharedStoryExpired(row, row.expiresAt)).toBe(true);
  });

  it("refuses a second row with the same slug", async () => {
    await create("same-ab12cd34", "h1");
    await expect(create("same-ab12cd34", "h2")).rejects.toThrow();
  });

  describe("findLiveSharedStoryByHash", () => {
    it("finds the live link for the same story", async () => {
      await create("a-ab12cd34", "h1");
      const row = await repo.findLiveSharedStoryByHash(db, 1, "h1", NOW);
      expect(row?.slug).toBe("a-ab12cd34");
    });

    it("ignores other stories", async () => {
      await create("a-ab12cd34", "h1");
      expect(await repo.findLiveSharedStoryByHash(db, 1, "h2", NOW)).toBeNull();
    });

    it("ignores expired links, so an old story gets a fresh one", async () => {
      await create("a-ab12cd34", "h1", new Date(NOW.getTime() - 91 * DAY));
      expect(await repo.findLiveSharedStoryByHash(db, 1, "h1", NOW)).toBeNull();
    });

    it("ignores another player's link with the same hash", async () => {
      await create("b-ab12cd34", "h1", NOW, 2);
      expect(await repo.findLiveSharedStoryByHash(db, 1, "h1", NOW)).toBeNull();
    });

    it("ignores a link with less than a week left, so a re-share gets a fresh one", async () => {
      await create("a-ab12cd34", "h1", new Date(NOW.getTime() - 84 * DAY));
      expect(await repo.findLiveSharedStoryByHash(db, 1, "h1", NOW)).toBeNull();
    });

    it("reuses a link with more than a week left", async () => {
      await create("a-ab12cd34", "h1", new Date(NOW.getTime() - 82 * DAY));
      expect((await repo.findLiveSharedStoryByHash(db, 1, "h1", NOW))?.slug).toBe("a-ab12cd34");
    });

    it("prefers the newest live link when there are several", async () => {
      await create("old-ab12cd34", "h1", new Date(NOW.getTime() - 2 * DAY));
      await create("new-ab12cd34", "h1", new Date(NOW.getTime() - 1 * DAY));
      expect((await repo.findLiveSharedStoryByHash(db, 1, "h1", NOW))?.slug).toBe("new-ab12cd34");
    });
  });

  describe("deleteExpiredSharedStories", () => {
    it("deletes only expired rows and says how many", async () => {
      await create("old1-ab12cd34", "h1", new Date(NOW.getTime() - 95 * DAY));
      await create("old2-ab12cd34", "h2", new Date(NOW.getTime() - 91 * DAY));
      await create("live-ab12cd34", "h3", new Date(NOW.getTime() - 10 * DAY));

      expect(await repo.deleteExpiredSharedStories(db, NOW)).toBe(2);
      expect(await repo.getSharedStory(db, "old1-ab12cd34")).toBeNull();
      expect(await repo.getSharedStory(db, "old2-ab12cd34")).toBeNull();
      expect(await repo.getSharedStory(db, "live-ab12cd34")).not.toBeNull();
    });

    it("is zero when nothing has expired", async () => {
      await create("live-ab12cd34", "h1");
      expect(await repo.deleteExpiredSharedStories(db, NOW)).toBe(0);
    });
  });
});
