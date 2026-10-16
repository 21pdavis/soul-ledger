import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { RankSlide } from "@/components/story/slides/RankSlide";
import { RosterSlide } from "@/components/story/slides/RosterSlide";
import type { StoryData } from "@/story/types";
import { fixtureSlideProps, fixtureStory } from "../fixtures/story";

// jsdom has no layout, so these fake one: a box is `box.height` tall and its content is 100px of
// fixed furniture plus 40px for each list row inside. The real geometry is checked in a browser
// (tests/e2e/slide-fit.spec.ts); this pins the rule: drop rows until the content fits, keep the
// first and the current one, and start over when the box is resized.

const motion = { active: true, skipAnimation: true, reducedMotion: true, paused: false };
const box = { height: 1000 };
let resize: (() => void) | undefined;

beforeEach(() => {
  box.height = 1000;
  resize = undefined;
  const rows = (el: HTMLElement) => el.querySelectorAll("li").length;
  vi.spyOn(HTMLElement.prototype, "scrollHeight", "get").mockImplementation(function (
    this: HTMLElement,
  ) {
    // Hiding the recent-form lines (data-tight) frees 50px.
    return 100 - (this.hasAttribute("data-tight") ? 50 : 0) + rows(this) * 40;
  });
  vi.spyOn(HTMLElement.prototype, "clientHeight", "get").mockImplementation(() => box.height);
  vi.stubGlobal(
    "ResizeObserver",
    class {
      cb: () => void;
      constructor(cb: () => void) {
        this.cb = cb;
        resize = cb;
      }
      // Like the real thing, report once as soon as observing starts: that is not a resize.
      observe() {
        this.cb();
      }
      disconnect() {}
    },
  );
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

const point = (i: number, badge: number) => ({
  at: new Date(Date.UTC(2026, 0, 1 + i * 10)).toISOString(),
  matchId: 1000 + i,
  badge,
  tier: Math.floor(badge / 10),
  subrank: badge % 10,
});

/** A long climb (14 distinct badges) that ends on Oracle 1. */
function longClimb(): StoryData["rank"] {
  const badges = [62, 71, 73, 75, 74, 76, 82, 83, 84, 91, 85, 86, 92, 81];
  const journey = badges.map((b, i) => point(i, b));
  return { journey, current: journey.at(-1)! };
}

const renderRank = () =>
  render(
    <RankSlide
      {...fixtureSlideProps({ story: fixtureStory({ rank: longClimb() }) })}
      {...motion}
    />,
  );

describe("RankSlide fits the stage it is in", () => {
  it("lists every milestone (up to the cap) when there is room", () => {
    renderRank();
    expect(screen.getAllByRole("listitem")).toHaveLength(7);
  });

  it("drops rows until the list fits, keeping the first row and the current rank", () => {
    box.height = 100 + 5 * 40; // room for five rows
    renderRank();
    const items = screen.getAllByRole("listitem");
    expect(items).toHaveLength(5);
    expect(items[0]).toHaveTextContent("Ritualist 2");
    expect(items.at(-1)).toHaveAttribute("aria-current", "step");
    expect(items.at(-1)).toHaveTextContent("Oracle 1");
  });

  it("plots the same badges it lists", () => {
    box.height = 100 + 4 * 40;
    const { container } = renderRank();
    expect(container.querySelectorAll("[data-badge]")).toHaveLength(4);
    expect(screen.getAllByRole("listitem")).toHaveLength(4);
  });

  it("never drops below three rows, even in a box that cannot hold them", () => {
    box.height = 10;
    renderRank();
    expect(screen.getAllByRole("listitem")).toHaveLength(3);
  });

  it("starts over from the full list when the stage grows", () => {
    box.height = 100 + 3 * 40;
    renderRank();
    expect(screen.getAllByRole("listitem")).toHaveLength(3);
    box.height = 1000;
    act(() => resize?.());
    expect(screen.getAllByRole("listitem")).toHaveLength(7);
  });
});

describe("RosterSlide fits the stage it is in", () => {
  const story = () => {
    const s = fixtureStory();
    s.roster.recent = { matches: 300, winRate: 0.65 };
    s.roster.topHeroes = [1, 2, 3, 4, 6].map((heroId) => ({
      heroId,
      matches: 100,
      winRate: 0.5,
      recent: { matches: 20, winRate: 0.6 },
    }));
    return s;
  };
  const renderRoster = () =>
    render(<RosterSlide {...fixtureSlideProps({ story: story() })} {...motion} />);

  it("lists all five top heroes when there is room", () => {
    renderRoster();
    expect(screen.getAllByRole("listitem")).toHaveLength(5);
  });

  it("shows the new full list when the number of heroes grows without a remount", () => {
    const few = story();
    few.roster.topHeroes = few.roster.topHeroes.slice(0, 3);
    const { rerender } = render(<RosterSlide {...fixtureSlideProps({ story: few })} {...motion} />);
    expect(screen.getAllByRole("listitem")).toHaveLength(3);
    rerender(<RosterSlide {...fixtureSlideProps({ story: story() })} {...motion} />);
    expect(screen.getAllByRole("listitem")).toHaveLength(5);
  });

  it("lists as many top heroes as fit, most played first, and at least three", () => {
    box.height = 100 + 4 * 40;
    const first = renderRoster();
    expect(screen.getAllByRole("listitem")).toHaveLength(4);
    expect(screen.getAllByRole("listitem")[0]).toHaveTextContent("Infernus");
    first.unmount();
    box.height = 10;
    renderRoster();
    expect(screen.getAllByRole("listitem")).toHaveLength(3);
  });

  it("wins rows back once the recent-form lines are hidden to make room", () => {
    // Three rows (220px) overflow; with the lines gone (50px freed) four rows (210px) fit.
    box.height = 210;
    renderRoster();
    expect(screen.getAllByRole("listitem")).toHaveLength(4);
  });
});
