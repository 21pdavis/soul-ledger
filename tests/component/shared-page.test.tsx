import { isValidElement } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { OpenedShare } from "@/lib/share/open";
import type { SharedSnapshot } from "@/lib/share/types";
import { fixtureStory } from "../fixtures/story";

const opened = vi.hoisted(() => ({ value: { kind: "notFound" } as OpenedShare }));
vi.mock("@/lib/share/open", () => ({ openSharedStory: async () => opened.value }));

import SharedPage, { generateMetadata } from "@/app/w/[slug]/page";

const params = Promise.resolve({ slug: "hazemain" });
const snapshot: SharedSnapshot = {
  version: 1,
  sharedAt: "2026-11-11T12:00:00.000Z",
  player: { accountId: 77, personaName: "Haze Main", avatarUrl: null },
  meta: { window: "all", patchStart: null, patchUnavailable: false },
  story: fixtureStory(),
};

beforeEach(() => {
  opened.value = { kind: "notFound" };
});

describe("/w/[slug] page", () => {
  it("is a 404 for an unknown slug", async () => {
    await expect(SharedPage({ params })).rejects.toMatchObject({
      digest: expect.stringContaining("404"),
    });
  });

  it("opens a live link on the frozen story", async () => {
    opened.value = { kind: "live", snapshot };
    const el = await SharedPage({ params });
    expect(isValidElement(el)).toBe(true);
    expect((el as { props: { shared: SharedSnapshot } }).props.shared).toBe(snapshot);
  });

  it("opens an expired link on the expired screen, without sending the story", async () => {
    opened.value = { kind: "expired", accountId: 77 };
    const el = (await SharedPage({ params })) as { props: Record<string, unknown> };
    expect(el.props.expiredAccountId).toBe(77);
    expect(JSON.stringify(el.props)).not.toContain("matchCount");
    expect(el.props.shared).toBeUndefined();
  });

  it("titles a live link with the player's name, and keeps expired and unknown links generic", async () => {
    opened.value = { kind: "live", snapshot };
    expect(await generateMetadata({ params })).toMatchObject({
      title: "Haze Main's Soul Ledger story",
    });
    opened.value = { kind: "expired", accountId: 77 };
    const generic = await generateMetadata({ params });
    expect(JSON.stringify(generic)).not.toContain("Haze Main");
  });

  it.each([null, "", "   "])(
    "titles a nameless player's link generically (%j)",
    async (personaName) => {
      opened.value = {
        kind: "live",
        snapshot: { ...snapshot, player: { ...snapshot.player, personaName } },
      };
      expect(await generateMetadata({ params })).toMatchObject({
        title: "A Soul Ledger player's story",
      });
    },
  );

  it("gives a live link a wide preview image and a large-image card", async () => {
    opened.value = { kind: "live", snapshot };
    const meta = await generateMetadata({ params });
    expect(meta.openGraph).toMatchObject({
      title: "Haze Main's Soul Ledger story",
      url: "/w/hazemain",
      images: [{ url: "/w/hazemain/preview", width: 1200, height: 630 }],
    });
    expect(meta.openGraph?.description).toBeTruthy();
    expect(meta.twitter).toMatchObject({
      card: "summary_large_image",
      images: ["/w/hazemain/preview"],
    });
    expect(meta.metadataBase).toBeInstanceOf(URL);
  });

  describe("the base for absolute preview addresses", () => {
    const baseFor = async () => {
      opened.value = { kind: "live", snapshot };
      return (await generateMetadata({ params })).metadataBase?.toString();
    };
    afterEach(() => vi.unstubAllEnvs());

    it("is RENDER_EXTERNAL_URL when set", async () => {
      vi.stubEnv("RENDER_EXTERNAL_URL", "https://soul-ledger-staging.onrender.com");
      expect(await baseFor()).toBe("https://soul-ledger-staging.onrender.com/");
    });

    it.each([
      ["unset", undefined],
      ["empty", ""],
      ["malformed", "not a url"],
    ])("falls back to localhost when it is %s, without throwing", async (_name, value) => {
      vi.stubEnv("RENDER_EXTERNAL_URL", value);
      expect(await baseFor()).toBe("http://localhost:3000/");
    });
  });

  it.each([{ kind: "expired", accountId: 77 } as const, { kind: "notFound" } as const])(
    "gives a $kind link a generic preview with no player data and no image",
    async (value) => {
      opened.value = value;
      const meta = await generateMetadata({ params });
      expect(meta.openGraph).toMatchObject({ title: "Soul Ledger" });
      expect(meta.openGraph).not.toHaveProperty("images");
      expect(meta.twitter).not.toHaveProperty("images");
      const json = JSON.stringify(meta);
      expect(json).not.toContain("Haze Main");
      expect(json).not.toContain("hazemain");
    },
  );
});
