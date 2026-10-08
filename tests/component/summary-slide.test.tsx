import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { SummarySlide } from "@/components/story/slides/SummarySlide";
import { ENTRY_COPY } from "@/story/copy-entry";
import type { StoryData } from "@/story/types";
import { fixtureSlideProps, fixtureStory } from "../fixtures/story";

type Variant = { skipAnimation: boolean; reducedMotion: boolean };
const VARIANTS: [string, Variant][] = [
  ["playing", { skipAnimation: false, reducedMotion: false }],
  ["skipped", { skipAnimation: true, reducedMotion: false }],
  ["reduced motion", { skipAnimation: false, reducedMotion: true }],
];

function renderSummary(
  story: StoryData = fixtureStory(),
  variant: Variant = VARIANTS[0][1],
  extra: Partial<ReturnType<typeof fixtureSlideProps>> = {},
) {
  const actions = { onRefresh: vi.fn(), onReplay: vi.fn(), onNewLookup: vi.fn() };
  const view = render(
    <SummarySlide
      {...fixtureSlideProps({ story, actions, ...extra })}
      active
      paused={false}
      {...variant}
    />,
  );
  return { actions, ...view };
}

describe.each(VARIANTS)("SummarySlide (%s)", (_name, variant) => {
  it("shows the headline numbers as real text", () => {
    renderSummary(fixtureStory(), variant);
    expect(screen.getByRole("heading", { name: "Entered into the ledger" })).toBeInTheDocument();
    const card = screen.getByRole("list", { name: "Your ledger entry" });
    expect(card).toHaveTextContent("Matches");
    expect(card).toHaveTextContent("120");
    expect(card).toHaveTextContent("Hours played");
    expect(card).toHaveTextContent("85");
    expect(card).toHaveTextContent("Main hero");
    expect(card).toHaveTextContent("Infernus");
    expect(card).toHaveTextContent("Melee kills");
    expect(card).toHaveTextContent("Top 0.5%");
    expect(card).toHaveTextContent("of Infernus players");
    expect(card).toHaveTextContent("Current rank");
    expect(card).toHaveTextContent("Oracle 1");
  });

  it("shows the window and how many matches the card is based on", () => {
    renderSummary(fixtureStory(), variant);
    expect(screen.getByText("All time")).toBeInTheDocument();
    expect(screen.getByText("Based on 120 matches")).toBeInTheDocument();
  });

  it("calls each action exactly once, and only that one", async () => {
    const { actions } = renderSummary(fixtureStory(), variant);
    await userEvent.click(screen.getByRole("button", { name: "Replay" }));
    expect(actions.onReplay).toHaveBeenCalledTimes(1);
    expect(actions.onNewLookup).not.toHaveBeenCalled();
    expect(actions.onRefresh).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole("button", { name: "Look up another player" }));
    expect(actions.onNewLookup).toHaveBeenCalledTimes(1);
    expect(actions.onRefresh).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole("button", { name: "Refresh" }));
    expect(actions.onRefresh).toHaveBeenCalledTimes(1);
    expect(actions.onReplay).toHaveBeenCalledTimes(1);
    expect(actions.onNewLookup).toHaveBeenCalledTimes(1);
  });

  it("stamps the card, and only moves the stamp when motion is allowed", () => {
    renderSummary(fixtureStory(), variant);
    const stamp = screen.getByTestId("summary-stamp");
    expect(stamp).toHaveAttribute("aria-hidden", "true");
    expect(stamp).toHaveTextContent("Entered into the ledger");
    const still = variant.skipAnimation || variant.reducedMotion;
    expect(stamp).toHaveAttribute("data-motion", still ? "still" : "play");
  });
});

describe("SummarySlide", () => {
  it("offers Replay, Look up another player and Refresh as real buttons", () => {
    renderSummary();
    for (const name of ["Replay", "Look up another player", "Refresh"]) {
      expect(screen.getByRole("button", { name }).tagName).toBe("BUTTON");
      expect(screen.getByRole("button", { name })).toHaveAttribute("type", "button");
    }
  });

  it("has no export action (PNG export is M4) and no cached-matches note (the app owns it)", () => {
    renderSummary(fixtureStory(), VARIANTS[0][1], {
      meta: { window: "all", patchStart: null, stale: true },
    });
    expect(screen.queryByRole("button", { name: /export|save|download|share/i })).toBeNull();
    expect(screen.queryByText(/cached matches/i)).toBeNull();
  });

  it("labels the patch window from the server's patch date", () => {
    renderSummary(fixtureStory(), VARIANTS[0][1], {
      meta: { window: "patch", patchStart: "2026-09-30T00:00:00.000Z", stale: false },
    });
    expect(screen.getByText("Since patch Sep 30, 2026")).toBeInTheDocument();
  });

  it("says 'match' for a single match", () => {
    const story = fixtureStory({ matchCount: 1 });
    story.intro.matches = 1;
    renderSummary(story);
    expect(screen.getByText("Based on 1 match")).toBeInTheDocument();
  });

  it("renders without a top stat when there is no MVP and no percentiles", () => {
    renderSummary(fixtureStory({ mvp: null, percentiles: [] }));
    const card = screen.getByRole("list", { name: "Your ledger entry" });
    expect(card).not.toHaveTextContent(/top \d/i);
    expect(within(card).getAllByRole("listitem")).toHaveLength(4);
    expect(screen.getByRole("button", { name: "Replay" })).toBeInTheDocument();
  });

  it("falls back to the best global percentile when there is no MVP", () => {
    renderSummary(fixtureStory({ mvp: null }));
    const card = screen.getByRole("list", { name: "Your ledger entry" });
    expect(card).toHaveTextContent("Melee kills");
    expect(card).toHaveTextContent("Top 3%");
    expect(card).toHaveTextContent("of all players");
    expect(card).not.toHaveTextContent("Infernus players");
  });

  it("renders without a rank when the player has none", () => {
    const story = fixtureStory();
    story.rank.current = null;
    renderSummary(story);
    const card = screen.getByRole("list", { name: "Your ledger entry" });
    expect(card).not.toHaveTextContent("Current rank");
    expect(card).toHaveTextContent("Infernus");
  });

  it("leaves the Valve notice to the app's strip under the player (ADR 0016), so it is never doubled", () => {
    renderSummary();
    expect(screen.queryByText(ENTRY_COPY.disclaimer)).toBeNull();
  });

  it("keeps list semantics on the ledger even with list-style removed (Safari, VoiceOver)", () => {
    renderSummary();
    expect(screen.getByRole("list", { name: "Your ledger entry" })).toHaveAttribute("role", "list");
  });
});
