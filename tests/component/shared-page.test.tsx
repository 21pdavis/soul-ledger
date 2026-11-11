import { isValidElement } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
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
      title: expect.stringContaining("Haze Main"),
    });
    opened.value = { kind: "expired", accountId: 77 };
    const generic = await generateMetadata({ params });
    expect(JSON.stringify(generic)).not.toContain("Haze Main");
  });
});
