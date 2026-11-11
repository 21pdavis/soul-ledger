import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { App } from "@/components/app/App";
import { StoryPlayer } from "@/components/story/StoryPlayer";
import { NO_PACE } from "@/lib/client/loading-pace";
import type { SharedSnapshot } from "@/lib/share/types";
import { SLIDES } from "@/story/copy";
import { fixtureSlideProps, fixtureStory } from "../fixtures/story";
import { ndjson, storyEvent, storyUp } from "./app-harness";
import { clearMedia, mockMedia } from "./media";

const stage = () => screen.getByTestId("story-stage");

afterEach(() => {
  clearMedia();
  vi.unstubAllGlobals();
});

describe("Share button in the story player", () => {
  it("is on the phone stage, and pressing it does not turn the slide", async () => {
    mockMedia();
    render(<StoryPlayer {...fixtureSlideProps()} entranceMs={30} />);
    await waitFor(() => expect(stage()).toHaveAttribute("data-animating", "false"));
    const share = screen.getByRole("button", { name: "Share" });
    expect(screen.getAllByRole("button", { name: "Share" })).toHaveLength(1);
    await userEvent.click(share);
    expect(stage()).toHaveAttribute("data-slide", SLIDES[0].id);
  });

  it("is on the current card only, on desktop", () => {
    mockMedia({ scroll: true });
    render(<StoryPlayer {...fixtureSlideProps()} />);
    expect(screen.getAllByRole("button", { name: "Share" })).toHaveLength(1);
  });
});

describe("Share in the app", () => {
  beforeEach(() => mockMedia());

  it("a normal story shares the player it looked up", async () => {
    // The lookup goes through the app's fetchImpl; Share uses the page's own fetch.
    const shareFetch = vi.fn(
      async () =>
        new Response(JSON.stringify({ slug: "gaben-abc" }), {
          headers: { "content-type": "application/json" },
        }),
    );
    vi.stubGlobal("fetch", shareFetch);
    const lookup = vi.fn(async () =>
      ndjson(storyEvent({ player: { accountId: 4242, personaName: "G", avatarUrl: null } })),
    );
    const user = userEvent.setup();
    render(<App fetchImpl={lookup as unknown as typeof fetch} pace={NO_PACE} />);
    await user.type(
      screen.getByLabelText("Paste your Steam profile URL"),
      "https://steamcommunity.com/id/gaben",
    );
    await user.click(screen.getByRole("button", { name: /open the ledger/i }));
    await storyUp();
    await user.click(await screen.findByRole("button", { name: "Share" }));
    await waitFor(() => expect(shareFetch).toHaveBeenCalledOnce());
    const [url, init] = shareFetch.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("/api/share");
    expect(JSON.parse(String(init.body))).toEqual({ accountId: 4242, window: "all" });
  });

  it("a shared page reuses its own link instead of making one", async () => {
    const snapshot: SharedSnapshot = {
      version: 1,
      sharedAt: "2026-11-11T09:30:00.000Z",
      player: { accountId: 4242, personaName: "Gaben", avatarUrl: null },
      meta: { window: "all", patchStart: null, patchUnavailable: false },
      story: fixtureStory(),
    };
    const fetchMock = vi.fn();
    const user = userEvent.setup();
    render(
      <App
        shared={snapshot}
        shareSlug="gaben-abc"
        fetchImpl={fetchMock as unknown as typeof fetch}
        pace={NO_PACE}
      />,
    );
    await storyUp();
    await user.click(await screen.findByRole("button", { name: "Share" }));
    expect(await screen.findByRole("link", { name: "Download picture" })).toHaveAttribute(
      "href",
      "/w/gaben-abc/picture/0",
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
