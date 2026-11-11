import { readFileSync } from "node:fs";
import type { Db } from "@/db";
import { getSharedStory, isSharedStoryExpired } from "@/db/repository";
import type { SharedSnapshot } from "./types";

/** What opening `/w/<slug>` finds. An expired link never carries the frozen story (ADR 0079). */
export type OpenedShare =
  | { kind: "notFound" }
  | { kind: "expired"; accountId: number }
  | { kind: "live"; snapshot: SharedSnapshot };

interface FixtureRow {
  expiresAt: string;
  snapshot: SharedSnapshot;
}

/**
 * Test seam: when `SHARED_STORY_FIXTURES` names a JSON file of `{ [slug]: { expiresAt, snapshot } }`,
 * the e2e server reads links from it instead of the database (CI's e2e has none). Never set in
 * any real environment.
 */
const FIXTURES_ENV = "SHARED_STORY_FIXTURES";

/** Looks a share link up by slug and says whether it is missing, expired or live. */
export async function openSharedStory(
  slug: string,
  now: Date,
  db?: Db,
  fixtureFile: string | undefined = process.env[FIXTURES_ENV],
): Promise<OpenedShare> {
  let row: { expiresAt: Date; snapshot: SharedSnapshot } | null;
  if (fixtureFile) {
    const fixtures = JSON.parse(readFileSync(fixtureFile, "utf8")) as Record<string, FixtureRow>;
    const hit = Object.hasOwn(fixtures, slug) ? fixtures[slug] : undefined;
    row = hit ? { expiresAt: new Date(hit.expiresAt), snapshot: hit.snapshot } : null;
  } else {
    const found = await getSharedStory(db ?? (await import("@/db")).getDb(), slug);
    row = found && { expiresAt: found.expiresAt, snapshot: found.snapshot as SharedSnapshot };
  }
  if (!row) return { kind: "notFound" };
  if (isSharedStoryExpired(row, now)) {
    return { kind: "expired", accountId: row.snapshot.player.accountId };
  }
  return { kind: "live", snapshot: row.snapshot };
}
