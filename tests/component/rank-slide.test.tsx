import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { RankSlide } from "@/components/story/slides/RankSlide";
import type { SlideComponentProps } from "@/components/story/slides";
import { headlineFor } from "@/story/copy";
import { RANK_EMPTY_LINE } from "@/story/copy-slides-8-10";
import type { StoryData } from "@/story/types";
import { fixtureSlideProps, fixtureStory } from "../fixtures/story";

type Point = StoryData["rank"]["journey"][number];
const motion = { active: true, skipAnimation: false, reducedMotion: false, paused: false };

const point = (i: number, badge: number): Point => ({
  at: new Date(Date.UTC(2026, 0, 1 + i * 20)).toISOString(),
  matchId: 1000 + i,
  badge,
  tier: Math.floor(badge / 10),
  subrank: badge % 10,
});

function renderRank(
  rank: StoryData["rank"] | undefined,
  flags: Partial<Pick<SlideComponentProps, "skipAnimation" | "reducedMotion" | "paused">> = {},
) {
  const story = rank ? fixtureStory({ rank }) : fixtureStory();
  return render(<RankSlide {...fixtureSlideProps({ story })} {...motion} {...flags} />);
}

const journeyOf = (badges: number[]): StoryData["rank"] => {
  const journey = badges.map((b, i) => point(i, b));
  return { journey, current: journey.at(-1) ?? null };
};

describe("RankSlide", () => {
  it.each([
    ["active", {}],
    ["skipAnimation", { skipAnimation: true }],
    ["reducedMotion", { reducedMotion: true }],
    ["paused", { paused: true }],
  ])("renders the headline, summary and every badge name as DOM text (%s)", (_n, flags) => {
    renderRank(undefined, flags);
    expect(screen.getByRole("heading", { name: headlineFor("rank") })).toBeInTheDocument();
    expect(screen.getByText(/now sit at Oracle 1/)).toBeInTheDocument();
    const items = screen.getAllByRole("listitem");
    expect(items.map((li) => li.textContent)).toEqual([
      expect.stringContaining("Sentinel 1"),
      expect.stringContaining("Ritualist 2"),
      expect.stringContaining("Oracle 1"),
    ]);
  });

  it("marks the current badge from rank.current, using the tier-name map", () => {
    renderRank(undefined, { reducedMotion: true });
    expect(within(screen.getByTestId("current-rank")).getByText("Oracle 1")).toBeInTheDocument();
  });

  it("shows the date of each badge in UTC", () => {
    renderRank(journeyOf([41, 62]), { reducedMotion: true });
    const items = screen.getAllByRole("listitem");
    expect(items[0]).toHaveTextContent("Jan 2026");
    // A space between the parts, so the text reads right when flattened.
    expect(items[0].textContent).toBe("Sentinel 1 Jan 2026");
  });

  it("falls back to the plain format for an unknown tier", () => {
    const rank = journeyOf([41, 62]);
    rank.journey[1] = { ...rank.journey[1], tier: 99, subrank: 2, badge: 992 };
    rank.current = rank.journey[1];
    renderRank(rank, { reducedMotion: true });
    expect(within(screen.getByTestId("current-rank")).getByText("Tier 99 · 2")).toBeInTheDocument();
  });

  it("draws the line through two or more badges", () => {
    const { container } = renderRank(undefined, { reducedMotion: true });
    expect(container.querySelector("polyline")).toBeInTheDocument();
    expect(container.querySelectorAll("[data-badge]")).toHaveLength(3);
  });

  it("renders a single point as a badge without a line", () => {
    const { container } = renderRank(journeyOf([81]), { reducedMotion: true });
    expect(container.querySelector("polyline")).not.toBeInTheDocument();
    expect(container.querySelectorAll("[data-badge]")).toHaveLength(1);
    expect(screen.getAllByText(/Oracle 1/).length).toBeGreaterThan(0);
    expect(screen.queryByText(RANK_EMPTY_LINE)).not.toBeInTheDocument();
  });

  it("draws no line when every match is at the same badge", () => {
    const { container } = renderRank(journeyOf([81, 81, 81]), { reducedMotion: true });
    expect(container.querySelector("polyline")).not.toBeInTheDocument();
    expect(screen.getAllByRole("listitem")).toHaveLength(1);
  });

  it("shows friendly copy for an empty journey", () => {
    const { container } = renderRank({ journey: [], current: null }, { reducedMotion: true });
    expect(screen.getByText(RANK_EMPTY_LINE)).toBeInTheDocument();
    expect(screen.queryAllByRole("listitem")).toHaveLength(0);
    expect(container.querySelector("svg")).not.toBeInTheDocument();
  });

  it("shows friendly copy when current is null even with a journey", () => {
    renderRank({ journey: [point(0, 41)], current: null }, { reducedMotion: true });
    expect(screen.getByText(RANK_EMPTY_LINE)).toBeInTheDocument();
    expect(screen.queryByTestId("current-rank")).not.toBeInTheDocument();
  });

  it("thins a long ranked history to a handful of badges", () => {
    const badges = Array.from({ length: 60 }, (_, i) => 11 + (i % 50));
    renderRank(journeyOf(badges), { reducedMotion: true });
    expect(screen.getAllByRole("listitem").length).toBeLessThanOrEqual(7);
  });

  it("keeps the decorative plot out of the accessibility tree", () => {
    const { container } = renderRank(undefined, { reducedMotion: true });
    expect(container.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
  });
});
