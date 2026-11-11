import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { Db } from "@/db";
import * as repo from "@/db/repository";
import { SHARE_FIXTURES_ENV, SHARE_FIXTURES_FILE } from "@/lib/share/fixture-path";
import { openSharedStory } from "@/lib/share/open";
import { SHARE_TTL_MS, type SharedSnapshot } from "@/lib/share/types";
import { createTestDb } from "../helpers/db";

let db: Db;
let close: () => Promise<void>;
beforeEach(async () => {
  ({ db, close } = await createTestDb());
});
afterEach(() => close());

const NOW = new Date("2026-11-11T12:00:00Z");
const snapshot: SharedSnapshot = {
  version: 1,
  sharedAt: NOW.toISOString(),
  player: { accountId: 77, personaName: "Haze Main", avatarUrl: null },
  meta: { window: "all", patchStart: null, patchUnavailable: false },
  story: { matchCount: 3 } as unknown as SharedSnapshot["story"],
};
const make = (slug: string, now = NOW) =>
  repo.createSharedStory(db, { slug, accountId: 77, contentHash: "h", snapshot, now });

describe("openSharedStory", () => {
  it("is not found for an unknown slug", async () => {
    expect(await openSharedStory("nobody", NOW, db)).toEqual({ kind: "notFound" });
  });

  it("returns the frozen snapshot for a live link", async () => {
    await make("hazemain");
    expect(await openSharedStory("hazemain", NOW, db)).toEqual({ kind: "live", snapshot });
  });

  it("is expired once past 90 days, carrying only the account id, never the story", async () => {
    await make("hazemain");
    const later = new Date(NOW.getTime() + SHARE_TTL_MS + 1);
    const result = await openSharedStory("hazemain", later, db);
    expect(result).toEqual({ kind: "expired", accountId: 77 });
    expect(JSON.stringify(result)).not.toContain("matchCount");
  });

  it("can serve fixture links from a file, for the e2e server only", async () => {
    const dir = mkdtempSync(join(tmpdir(), "shares-"));
    const file = join(dir, "fixtures.json");
    writeFileSync(
      file,
      JSON.stringify({ "e2e-live": { expiresAt: "2099-01-01T00:00:00Z", snapshot } }),
    );
    expect(await openSharedStory("e2e-live", NOW, undefined, file)).toEqual({
      kind: "live",
      snapshot,
    });
    expect(await openSharedStory("other", NOW, undefined, file)).toEqual({ kind: "notFound" });
  });

  describe("the SHARED_STORY_FIXTURES env hook", () => {
    const saved = { fixtures: process.env[SHARE_FIXTURES_ENV], render: process.env.RENDER };
    const restore = (key: string, value: string | undefined) => {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    };
    const writeAt = (file: string) => {
      mkdirSync(join(file, ".."), { recursive: true });
      writeFileSync(
        file,
        JSON.stringify({ "e2e-live": { expiresAt: "2099-01-01T00:00:00Z", snapshot } }),
      );
    };
    beforeEach(() => {
      delete process.env.RENDER;
    });
    afterEach(() => {
      restore(SHARE_FIXTURES_ENV, saved.fixtures);
      restore("RENDER", saved.render);
    });

    it("honours the one fixed e2e path", async () => {
      writeAt(SHARE_FIXTURES_FILE);
      process.env[SHARE_FIXTURES_ENV] = SHARE_FIXTURES_FILE;
      expect((await openSharedStory("e2e-live", NOW, db)).kind).toBe("live");
    });

    it("ignores an env path that is not the fixed one", async () => {
      const other = join(mkdtempSync(join(tmpdir(), "shares-")), "x.json");
      writeAt(other);
      process.env[SHARE_FIXTURES_ENV] = other;
      expect(await openSharedStory("e2e-live", NOW, db)).toEqual({ kind: "notFound" });
    });

    it("ignores the env path whenever RENDER is set", async () => {
      writeAt(SHARE_FIXTURES_FILE);
      process.env[SHARE_FIXTURES_ENV] = SHARE_FIXTURES_FILE;
      process.env.RENDER = "true";
      expect(await openSharedStory("e2e-live", NOW, db)).toEqual({ kind: "notFound" });
    });
  });
});
