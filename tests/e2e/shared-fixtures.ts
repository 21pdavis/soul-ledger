import { mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fixtureStory } from "../fixtures/story";

/**
 * Share links for the e2e server, written once when the Playwright config loads and handed to the
 * web server as `SHARED_STORY_FIXTURES` (CI's e2e has no database). Keep the slugs in sync with
 * shared-link.spec.ts.
 */
export const LIVE_SLUG = "e2e-live";
export const EXPIRED_SLUG = "e2e-expired";
export const SHARED_AT = "2026-11-11T23:30:00.000Z";

export function writeShareFixtures(): string {
  const snapshot = {
    version: 1,
    sharedAt: SHARED_AT,
    player: { accountId: 1, personaName: "Gaben", avatarUrl: null },
    meta: { window: "all", patchStart: null, patchUnavailable: false },
    story: fixtureStory(),
  };
  const dir = join(tmpdir(), "soul-ledger-e2e");
  mkdirSync(dir, { recursive: true });
  const file = join(dir, "share-fixtures.json");
  writeFileSync(
    file,
    JSON.stringify({
      [LIVE_SLUG]: { expiresAt: "2099-01-01T00:00:00.000Z", snapshot },
      [EXPIRED_SLUG]: { expiresAt: "2020-01-01T00:00:00.000Z", snapshot },
    }),
  );
  return file;
}
