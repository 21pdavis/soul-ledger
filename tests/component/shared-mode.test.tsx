import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { IntroSlide } from "@/components/story/slides/IntroSlide";
import { SummarySlide } from "@/components/story/slides/SummarySlide";
import { App } from "@/components/app/App";
import { NO_PACE } from "@/lib/client/loading-pace";
import type { SharedSnapshot } from "@/lib/share/types";
import { fixtureSlideProps, fixtureStory } from "../fixtures/story";
import { ndjson, storyEvent, storyUp } from "./app-harness";

const SHARED: { at: string; playerName?: string | null } = {
  at: "2026-11-11T23:59:00.000Z",
};
const LINE = "Shared Nov 11, 2026 · numbers from that day";

function renderSlide(Slide: typeof IntroSlide, shared?: typeof SHARED) {
  const actions = {
    onRefresh: vi.fn(),
    onReplay: vi.fn(),
    onNewLookup: vi.fn(),
    onSeeLatest: vi.fn(),
  };
  const props = fixtureSlideProps({
    meta: { window: "all", patchStart: null, stale: true, shared },
    actions,
  });
  render(<Slide {...props} active skipAnimation reducedMotion paused={false} />);
  return actions;
}

describe.each([
  ["intro", IntroSlide],
  ["summary", SummarySlide],
])("shared mode on the %s slide", (_name, Slide) => {
  it("shows the shared date line (UTC) and the two shared actions, without Refresh", async () => {
    const actions = renderSlide(Slide, SHARED);
    expect(screen.getByText(LINE)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Refresh" })).not.toBeInTheDocument();
    expect(screen.queryByText(/saved matches/i)).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "See their latest" }));
    expect(actions.onSeeLatest).toHaveBeenCalledOnce();
    await userEvent.click(screen.getByRole("button", { name: "Look up your own" }));
    expect(actions.onNewLookup).toHaveBeenCalledOnce();
  });

  it("is unchanged for a normal story", () => {
    renderSlide(Slide);
    expect(screen.getByRole("button", { name: "Refresh" })).toBeInTheDocument();
    expect(screen.queryByText(LINE)).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "See their latest" })).not.toBeInTheDocument();
  });
});

describe("whose story it is, on the shared first slide", () => {
  it("names the player above the headline", () => {
    renderSlide(IntroSlide, { ...SHARED, playerName: "Gaben" });
    const label = screen.getByText("Gaben's story");
    const headline = screen.getByRole("heading", { level: 2 });
    expect(label.compareDocumentPosition(headline) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it.each([null, "   "])("falls back to a generic line for a %j name", (playerName) => {
    renderSlide(IntroSlide, { ...SHARED, playerName });
    expect(screen.getByText("A Soul Ledger player's story")).toBeInTheDocument();
  });

  it("is not shown on a normal story", () => {
    renderSlide(IntroSlide);
    expect(screen.queryByText(/'s story$/)).not.toBeInTheDocument();
  });

  it("flows from the snapshot through the app", () => {
    render(<App shared={snapshot()} pace={NO_PACE} />);
    expect(screen.getByText("Gaben's story")).toBeInTheDocument();
  });
});

const snapshot = (): SharedSnapshot => ({
  version: 1,
  sharedAt: SHARED.at,
  player: { accountId: 4242, personaName: "Gaben", avatarUrl: null },
  meta: { window: "all", patchStart: null, patchUnavailable: false },
  story: fixtureStory(),
});

describe("App opened on a shared story", () => {
  it("starts in the story with no lookup, and See their latest runs a live lookup", async () => {
    const fetchMock = vi.fn(async (url: RequestInfo | URL) => {
      void url;
      return ndjson(storyEvent());
    });
    const user = userEvent.setup();
    render(
      <App shared={snapshot()} fetchImpl={fetchMock as unknown as typeof fetch} pace={NO_PACE} />,
    );
    await storyUp();
    expect(fetchMock).not.toHaveBeenCalled();
    expect(screen.getByText(LINE)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "See their latest" }));
    await storyUp();
    expect(fetchMock).toHaveBeenCalledOnce();
    expect(new URL(String(fetchMock.mock.calls[0][0]), "http://x").searchParams.get("q")).toBe(
      "4242",
    );
    // The live story is a normal one: Refresh is back and the shared line is gone.
    expect(await screen.findByRole("button", { name: "Refresh" })).toBeInTheDocument();
    expect(screen.queryByText(LINE)).not.toBeInTheDocument();
  });

  it("Look up your own goes to the entry screen", async () => {
    const user = userEvent.setup();
    render(<App shared={snapshot()} pace={NO_PACE} />);
    await storyUp();
    await user.click(screen.getByRole("button", { name: "Look up your own" }));
    expect(screen.getByLabelText("Paste your Steam profile URL")).toBeInTheDocument();
  });
});
