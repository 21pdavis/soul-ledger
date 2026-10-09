import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { SlideComponent } from "@/components/story/slides";
import { IntroSlide } from "@/components/story/slides/IntroSlide";
import { MainSlide } from "@/components/story/slides/MainSlide";
import { RosterSlide } from "@/components/story/slides/RosterSlide";
import { ScavengerSlide } from "@/components/story/slides/ScavengerSlide";
import { headlineFor } from "@/story/copy";
import type { SlideProps, StoryData } from "@/story/types";
import { fixtureSlideProps, fixtureStory } from "../fixtures/story";

interface Opts {
  story?: Partial<StoryData>;
  meta?: Partial<SlideProps["meta"]>;
  actions?: Partial<SlideProps["actions"]>;
  active?: boolean;
  skipAnimation?: boolean;
  reducedMotion?: boolean;
  paused?: boolean;
}

/** Final-state rendering by default (reduced motion), so text assertions are stable. */
function show(Slide: SlideComponent, o: Opts = {}) {
  const base = fixtureSlideProps();
  return render(
    <Slide
      story={fixtureStory(o.story)}
      meta={{ ...base.meta, ...o.meta }}
      actions={{ ...base.actions, ...o.actions }}
      active={o.active ?? true}
      skipAnimation={o.skipAnimation ?? false}
      reducedMotion={o.reducedMotion ?? true}
      paused={o.paused ?? false}
    />,
  );
}

const intro = (over: Partial<StoryData["intro"]> = {}) => ({
  intro: { ...fixtureStory().intro, ...over },
});

describe("slide 1: Intro", () => {
  it("renders its fixed headline in the frame", () => {
    show(IntroSlide);
    expect(screen.getByRole("heading", { name: headlineFor("intro") })).toBeInTheDocument();
  });

  it("shows intro.matches and intro.hoursPlayed", () => {
    show(IntroSlide, { story: intro({ matches: 120, hoursPlayed: 84.5 }) });
    expect(screen.getByText("120")).toBeInTheDocument();
    expect(screen.getByText("85")).toBeInTheDocument();
  });

  it.each([
    [0.2, "0.2"],
    [9.96, "10"],
    [120, "120"],
    [0, "0"],
  ])("formats %s hours as %s", (hoursPlayed, text) => {
    show(IntroSlide, { story: { ...intro({ hoursPlayed, matches: 7 }), matchCount: 7 } });
    const hours = screen.getByTestId("intro-hours");
    expect(hours).toHaveTextContent(new RegExp(`^${text} `));
  });

  it("renders a zero match count as 0", () => {
    show(IntroSlide, { story: { ...intro({ matches: 0, hoursPlayed: 0 }), matchCount: 0 } });
    expect(screen.getByTestId("intro-matches")).toHaveTextContent(/^0 /);
  });

  it("shows 'Based on N matches' from matchCount, and the window", () => {
    show(IntroSlide, { story: { matchCount: 87 } });
    expect(screen.getByText("Based on 87 matches")).toBeInTheDocument();
    expect(screen.getByText("All time")).toBeInTheDocument();
  });

  it("labels a patch window with the server's patch date, in UTC", () => {
    show(IntroSlide, { meta: { window: "patch", patchStart: "2026-09-01T00:00:00.000Z" } });
    expect(screen.getByText("Since patch Sep 1, 2026")).toBeInTheDocument();
  });

  it("has a Refresh button that calls onRefresh", async () => {
    const onRefresh = vi.fn();
    show(IntroSlide, { actions: { onRefresh } });
    await userEvent.click(screen.getByRole("button", { name: "Refresh" }));
    expect(onRefresh).toHaveBeenCalledTimes(1);
  });

  it("makes Refresh its only control", () => {
    show(IntroSlide);
    expect(screen.getAllByRole("button")).toHaveLength(1);
    expect(screen.queryAllByRole("link")).toHaveLength(0);
  });

  it("shows the first and last match dates when present", () => {
    show(IntroSlide, {
      story: intro({
        firstMatchAt: "2026-01-02T10:00:00.000Z",
        lastMatchAt: "2026-09-30T20:00:00.000Z",
      }),
    });
    expect(screen.getByText("Jan 2, 2026")).toBeInTheDocument();
    expect(screen.getByText("Sep 30, 2026")).toBeInTheDocument();
  });

  it("omits the dates when they are null", () => {
    show(IntroSlide, { story: intro({ firstMatchAt: null, lastMatchAt: null }) });
    expect(screen.queryByText("First entry")).not.toBeInTheDocument();
    expect(screen.queryByText("Latest entry")).not.toBeInTheDocument();
  });

  it("omits only the date that is null", () => {
    show(IntroSlide, { story: intro({ firstMatchAt: null }) });
    expect(screen.queryByText("First entry")).not.toBeInTheDocument();
    expect(screen.getByText("Latest entry")).toBeInTheDocument();
  });

  it("shows final counter values at once under reduced motion", () => {
    show(IntroSlide, { reducedMotion: true });
    expect(screen.getByText("120")).toBeInTheDocument();
  });

  it("counts up from 0 when motion is on, and lands on the final values", async () => {
    show(IntroSlide, { reducedMotion: false });
    expect(screen.getByTestId("intro-matches")).toHaveTextContent(/^0 /);
    await waitFor(() => expect(screen.getByText("120")).toBeInTheDocument(), { timeout: 2000 });
  });

  it("jumps to the final values when skipAnimation is set", () => {
    show(IntroSlide, { reducedMotion: false, skipAnimation: true });
    expect(screen.getByText("120")).toBeInTheDocument();
  });
});

describe("slide 2: Your main", () => {
  it("shows the hero name, its art, matches and win rate", () => {
    show(MainSlide);
    expect(screen.getByRole("heading", { name: headlineFor("main") })).toBeInTheDocument();
    expect(screen.getByText("Infernus")).toBeInTheDocument();
    expect(document.querySelector('img[src="/heroes/1-card.webp"]')).not.toBeNull();
    expect(screen.getByTestId("main-matches")).toHaveTextContent("50");
    expect(screen.getByTestId("main-winrate")).toHaveTextContent("60%");
  });

  it("falls back to 'Hero #id' for an unknown hero", () => {
    show(MainSlide, { story: { main: { ...fixtureStory().main!, heroId: 999 } } });
    expect(screen.getByText("Hero #999")).toBeInTheDocument();
  });

  it("shows the same-hero line from the best (lowest topPercent) main.percentiles entry", () => {
    const pct = fixtureStory().percentiles[0];
    show(MainSlide, {
      story: {
        main: {
          ...fixtureStory().main!,
          percentiles: [
            { ...pct, label: "Accuracy", topPercent: 40 },
            { ...pct, label: "Kills per match", topPercent: 12 },
          ],
        },
      },
    });
    expect(screen.getByText("Top 12% of Infernus players")).toBeInTheDocument();
    expect(screen.getByText("Kills per match")).toBeInTheDocument();
    expect(screen.queryByText(/all players/)).not.toBeInTheDocument();
  });

  it("falls back to the global line, with no hero name, when main.percentiles is empty", () => {
    const pct = fixtureStory().percentiles[0];
    show(MainSlide, {
      story: {
        main: { ...fixtureStory().main!, percentiles: [] },
        percentiles: [
          { ...pct, label: "Parries", topPercent: 25 },
          { ...pct, label: "Melee kills", topPercent: 3 },
        ],
      },
    });
    expect(screen.getByText("Top 3% of all players")).toBeInTheDocument();
    expect(screen.getByText("Melee kills")).toBeInTheDocument();
    expect(screen.queryByText(/of Infernus players/)).not.toBeInTheDocument();
  });

  it("shows no percentile line when both lists are empty, and still renders", () => {
    show(MainSlide, {
      story: { main: { ...fixtureStory().main!, percentiles: [] }, percentiles: [] },
    });
    expect(screen.getByText("Infernus")).toBeInTheDocument();
    expect(screen.queryByText(/^Top /)).not.toBeInTheDocument();
  });

  it("says '1 match' for a single main-hero match", () => {
    show(MainSlide, { story: { main: { ...fixtureStory().main!, matches: 1 } } });
    expect(screen.getByTestId("main-matches")).toHaveTextContent("1 match");
    expect(screen.getByTestId("main-matches")).not.toHaveTextContent("1 matches");
  });

  it("shows neutral copy and no percentile claim when the best same-hero entry is above 50", () => {
    const pct = fixtureStory().percentiles[0];
    show(MainSlide, {
      story: {
        main: {
          ...fixtureStory().main!,
          percentiles: [
            { ...pct, label: "Accuracy", topPercent: 87 },
            { ...pct, label: "Kills per match", topPercent: 64 },
          ],
        },
      },
    });
    expect(screen.queryByText(/^Top /)).not.toBeInTheDocument();
    expect(screen.queryByText("Kills per match")).not.toBeInTheDocument();
    expect(screen.getByTestId("main-neutral")).toBeInTheDocument();
  });

  it("still claims the percentile when the best entry is exactly 50", () => {
    const pct = fixtureStory().percentiles[0];
    show(MainSlide, {
      story: { main: { ...fixtureStory().main!, percentiles: [{ ...pct, topPercent: 50 }] } },
    });
    expect(screen.getByText("Top 50% of Infernus players")).toBeInTheDocument();
  });

  it("shows neutral copy when only a weak global entry exists", () => {
    const pct = fixtureStory().percentiles[0];
    show(MainSlide, {
      story: {
        main: { ...fixtureStory().main!, percentiles: [] },
        percentiles: [{ ...pct, topPercent: 70 }],
      },
    });
    expect(screen.queryByText(/^Top /)).not.toBeInTheDocument();
    expect(screen.getByTestId("main-neutral")).toBeInTheDocument();
  });

  it("shows neither a claim nor neutral copy when there are no percentiles at all", () => {
    show(MainSlide, {
      story: { main: { ...fixtureStory().main!, percentiles: [] }, percentiles: [] },
    });
    expect(screen.queryByTestId("main-neutral")).not.toBeInTheDocument();
  });

  it("does not break when main is null", () => {
    show(MainSlide, { story: { main: null } });
    expect(screen.getByRole("heading", { name: headlineFor("main") })).toBeInTheDocument();
  });

  it("renders a zero win rate as 0%", () => {
    show(MainSlide, { story: { main: { ...fixtureStory().main!, wins: 0, winRate: 0 } } });
    expect(screen.getByTestId("main-winrate")).toHaveTextContent("0%");
  });

  it("has no controls", () => {
    show(MainSlide);
    expect(screen.queryAllByRole("button")).toHaveLength(0);
  });

  it("counts up with motion on and is final with skipAnimation", async () => {
    const { unmount } = show(MainSlide, { reducedMotion: false });
    expect(screen.getByTestId("main-matches")).toHaveTextContent(/^0/);
    unmount();
    show(MainSlide, { reducedMotion: false, skipAnimation: true });
    expect(screen.getByTestId("main-matches")).toHaveTextContent("50");
  });
});

describe("slide 3: Roster", () => {
  it("shows roster.heroesPlayed", () => {
    show(RosterSlide);
    expect(screen.getByRole("heading", { name: headlineFor("roster") })).toBeInTheDocument();
    expect(screen.getByTestId("roster-heroes")).toHaveTextContent("9 heroes played");
  });

  it("says 'hero played' for a single hero", () => {
    show(RosterSlide, {
      story: { roster: { ...fixtureStory().roster, heroesPlayed: 1, topHeroes: [] } },
    });
    expect(screen.getByTestId("roster-heroes")).toHaveTextContent("1 hero played");
  });

  it("shows the One-trick label for a one-trick", () => {
    show(RosterSlide, { story: { roster: { ...fixtureStory().roster, label: "one-trick" } } });
    expect(screen.getByText("One-trick")).toBeInTheDocument();
    expect(screen.queryByText("Flex")).not.toBeInTheDocument();
  });

  it("shows the Flex label otherwise", () => {
    show(RosterSlide, { story: { roster: { ...fixtureStory().roster, label: "flex" } } });
    expect(screen.getByText("Flex")).toBeInTheDocument();
    expect(screen.queryByText("One-trick")).not.toBeInTheDocument();
  });

  it("lists the top 5 heroes in the given order with name, matches and win rate", () => {
    show(RosterSlide);
    const rows = within(screen.getByRole("list")).getAllByRole("listitem");
    expect(rows).toHaveLength(5);
    const expected = [
      ["Infernus", "50", "60%"],
      ["Seven", "30", "50%"],
      ["Vindicta", "15", "40%"],
      ["Lady Geist", "10", "70%"],
      ["Abrams", "5", "20%"],
    ];
    expected.forEach(([name, matches, winRate], i) => {
      expect(rows[i]).toHaveTextContent(name);
      expect(rows[i]).toHaveTextContent(`${matches} matches`);
      expect(rows[i]).toHaveTextContent(`${winRate} win rate`);
    });
  });

  it("keeps the given order even when it is not sorted by name or rate", () => {
    show(RosterSlide, {
      story: {
        roster: {
          ...fixtureStory().roster,
          topHeroes: [
            { heroId: 6, matches: 9, winRate: 0.1 },
            { heroId: 1, matches: 4, winRate: 0.9 },
          ],
        },
      },
    });
    const rows = screen.getAllByRole("listitem");
    expect(rows).toHaveLength(2);
    expect(rows[0]).toHaveTextContent("Abrams");
    expect(rows[1]).toHaveTextContent("Infernus");
  });

  it("renders a hero with zero wins as 0%", () => {
    show(RosterSlide, {
      story: {
        roster: {
          ...fixtureStory().roster,
          topHeroes: [{ heroId: 1, matches: 3, winRate: 0 }],
        },
      },
    });
    expect(screen.getByRole("listitem")).toHaveTextContent("0% win rate");
  });

  it("says '1 match' for a hero with a single match", () => {
    show(RosterSlide, {
      story: {
        roster: {
          ...fixtureStory().roster,
          topHeroes: [{ heroId: 1, matches: 1, winRate: 1 }],
        },
      },
    });
    expect(screen.getByRole("listitem")).toHaveTextContent("1 match");
    expect(screen.getByRole("listitem")).not.toHaveTextContent("1 matches");
  });

  it("copes with no top heroes", () => {
    show(RosterSlide, { story: { roster: { ...fixtureStory().roster, topHeroes: [] } } });
    expect(screen.queryByRole("listitem")).not.toBeInTheDocument();
  });

  it("has no controls", () => {
    show(RosterSlide);
    expect(screen.queryAllByRole("button")).toHaveLength(0);
  });

  it("shows the heroes-played count final under skipAnimation, from 0 when motion is on", () => {
    const { unmount } = show(RosterSlide, { reducedMotion: false });
    expect(screen.getByTestId("roster-heroes")).toHaveTextContent(/^0 /);
    unmount();
    show(RosterSlide, { reducedMotion: false, skipAnimation: true });
    expect(screen.getByTestId("roster-heroes")).toHaveTextContent(/^9 /);
  });
});

describe("slide 4: Scavenger card", () => {
  it("shows the three stats with their labels and values", () => {
    show(ScavengerSlide);
    expect(screen.getByRole("heading", { name: headlineFor("scavenger") })).toBeInTheDocument();
    expect(screen.getByTestId("scavenger-crate-goblin")).toHaveTextContent("Crate Goblin");
    expect(screen.getByTestId("scavenger-crate-goblin")).toHaveTextContent("1,800");
    expect(screen.getByTestId("scavenger-gambler")).toHaveTextContent("Gambler");
    expect(screen.getByTestId("scavenger-gambler")).toHaveTextContent("42");
    expect(screen.getByTestId("scavenger-urn-mule")).toHaveTextContent("Urn Mule");
    expect(screen.getByTestId("scavenger-urn-mule")).toHaveTextContent("77");
  });

  it("captions the Urn Mule stat as urns returned, not idols", () => {
    show(ScavengerSlide);
    const mule = screen.getByTestId("scavenger-urn-mule");
    expect(mule).toHaveTextContent(/^Urn Mule 77 urns returned$/);
    expect(mule).not.toHaveTextContent(/idols/i);
  });

  it("places Crate Goblin top-left, Gambler middle-right and Urn Mule bottom-left, on one card", () => {
    show(ScavengerSlide);
    expect(screen.getByTestId("scavenger-card")).toBeInTheDocument();
    expect(screen.getByTestId("scavenger-crate-goblin")).toHaveAttribute("data-place", "top-left");
    expect(screen.getByTestId("scavenger-gambler")).toHaveAttribute("data-place", "middle-right");
    expect(screen.getByTestId("scavenger-urn-mule")).toHaveAttribute("data-place", "bottom-left");
    const card = screen.getByTestId("scavenger-card");
    const order = within(card)
      .getAllByTestId(/^scavenger-(crate|gambler|urn)/)
      .map((el) => el.getAttribute("data-place"));
    expect(order).toEqual(["top-left", "middle-right", "bottom-left"]);
  });

  it("still renders a zero value as 0, with its label", () => {
    show(ScavengerSlide, {
      story: { scavenger: { breakables: 0, sinnerJackpots: 0, idolsReturned: 5 } },
    });
    const goblin = screen.getByTestId("scavenger-crate-goblin");
    expect(goblin).toHaveTextContent("Crate Goblin");
    expect(goblin).toHaveTextContent(/^Crate Goblin 0 breakables smashed$/);
    expect(screen.getByTestId("scavenger-gambler")).toHaveTextContent(/^Gambler 0 /);
    expect(screen.getByTestId("scavenger-urn-mule")).toHaveTextContent(/^Urn Mule 5 /);
  });

  it("counts up from 0 with motion on and lands on the values", async () => {
    show(ScavengerSlide, { reducedMotion: false });
    expect(screen.getByTestId("scavenger-gambler")).toHaveTextContent(/^Gambler 0 /);
    await waitFor(
      () => expect(screen.getByTestId("scavenger-gambler")).toHaveTextContent(/^Gambler 42 /),
      { timeout: 2000 },
    );
  });

  it("shows final values at once under skipAnimation", () => {
    show(ScavengerSlide, { reducedMotion: false, skipAnimation: true });
    expect(screen.getByTestId("scavenger-crate-goblin")).toHaveTextContent("1,800");
  });

  it("has no controls", () => {
    show(ScavengerSlide);
    expect(screen.queryAllByRole("button")).toHaveLength(0);
  });
});
