import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { Db } from "@/db";
import * as repo from "@/db/repository";
import { cleanupSharedStories } from "@/lib/share/cleanup";
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

async function create(slug: string, daysUntilExpiry: number) {
  await repo.createSharedStory(db, {
    slug,
    accountId: 1,
    contentHash: slug,
    snapshot: { version: 1 } as unknown as SharedSnapshot,
    now: new Date(NOW.getTime() + daysUntilExpiry * DAY - SHARE_TTL_MS),
  });
}

describe("cleanupSharedStories", () => {
  it("deletes expired links, keeps live ones and reports the count", async () => {
    await create("old-one", -1);
    await create("old-two", -30);
    await create("live-one", 1);

    const result = await cleanupSharedStories(db, NOW);

    expect(result.deleted).toBe(2);
    expect(result.message).toBe("Deleted 2 expired shared stories.");
    expect(await repo.getSharedStory(db, "live-one")).not.toBeNull();
    expect(await repo.getSharedStory(db, "old-one")).toBeNull();
  });
});
