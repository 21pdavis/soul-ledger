import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { RoastSlide } from "@/components/story/slides/RoastSlide";
import type { SlideComponentProps } from "@/components/story/slides";
import { headlineFor } from "@/story/copy";
import { UNSPENT_NEUTRAL_LINE } from "@/story/copy-slides-8-10";
import type { StoryData } from "@/story/types";
import { fixtureSlideProps, fixtureStory } from "../fixtures/story";

const motion = { active: true, skipAnimation: false, reducedMotion: false, paused: false };

function renderRoast(
  roast: Partial<StoryData["roast"]> = {},
  extra: Partial<StoryData> = {},
  flags: Partial<
    Pick<SlideComponentProps, "active" | "skipAnimation" | "reducedMotion" | "paused">
  > = {},
) {
  const base = fixtureStory();
  const story = fixtureStory({ ...extra, roast: { ...base.roast, ...roast } });
  return render(<RoastSlide {...fixtureSlideProps({ story })} {...motion} {...flags} />);
}

const still = { reducedMotion: true };

describe("RoastSlide", () => {
  it.each([
    ["active", {}],
    ["skipAnimation", { skipAnimation: true }],
    ["reducedMotion", { reducedMotion: true }],
    ["paused", { paused: true }],
  ])("renders the headline, hotspot and totals as DOM text (%s)", (_name, flags) => {
    renderRoast({}, {}, flags);
    expect(screen.getByRole("heading", { name: headlineFor("roast") })).toBeInTheDocument();
    expect(screen.getByText("You died here 2 times")).toBeInTheDocument();
    expect(screen.getByText("deaths in total")).toBeInTheDocument();
    expect(screen.getByText(/Worst night: 21 deaths as Infernus/)).toBeInTheDocument();
  });

  describe("death heatmap", () => {
    it("is an SVG with an accessible title and description summarising it", () => {
      renderRoast({}, {}, still);
      const plot = screen.getByRole("img", { name: /where you died/i });
      expect(plot.tagName.toLowerCase()).toBe("svg");
      expect(plot).toHaveAccessibleDescription(/3 deaths.*hottest.*2/i);
    });

    it("names the hottest cell with N equal to that cell's count", () => {
      renderRoast(
        {
          deathPositions: [
            [5000, 5000],
            [5100, 5100],
            [5200, 5050],
            [-6000, -6000],
          ],
        },
        {},
        still,
      );
      expect(screen.getByText("You died here 3 times")).toBeInTheDocument();
    });

    it("leaves out-of-range positions out of the counts", () => {
      renderRoast(
        {
          deathPositions: [
            [100, 200],
            [99_999, 0],
            [0, -99_999],
          ],
        },
        {},
        still,
      );
      expect(screen.getByText("You died here 1 time")).toBeInTheDocument();
      expect(screen.getByRole("img", { name: /where you died/i })).toHaveAccessibleDescription(
        /1 death/i,
      );
    });

    it("draws one rect per occupied cell", () => {
      renderRoast(
        {
          deathPositions: [
            [0, 0],
            [9000, 9000],
            [9100, 9100],
          ],
        },
        {},
        still,
      );
      const plot = screen.getByRole("img", { name: /where you died/i });
      expect(plot.querySelectorAll("rect[data-count]")).toHaveLength(2);
    });

    it("replaces the plot with friendly copy when there are no positions", () => {
      renderRoast({ deathPositions: [] }, {}, still);
      expect(screen.queryByRole("img", { name: /where you died/i })).not.toBeInTheDocument();
      expect(screen.queryByText(/You died here/)).not.toBeInTheDocument();
      expect(screen.getByText(/knows you died, just not where/i)).toBeInTheDocument();
    });

    it("also uses the friendly copy when every position is out of range", () => {
      renderRoast({ deathPositions: [[99_999, 99_999]] }, {}, still);
      expect(screen.queryByRole("img", { name: /where you died/i })).not.toBeInTheDocument();
      expect(screen.getByText(/knows you died, just not where/i)).toBeInTheDocument();
    });
  });

  describe("deaths and worst match", () => {
    it("counts the deaths up to the total, or shows it at once when motion is off", async () => {
      const { unmount } = renderRoast({}, {}, still);
      expect(screen.getByText("1,100")).toBeInTheDocument();
      unmount();
      renderRoast();
      expect(await screen.findByText("1,100", {}, { timeout: 1500 })).toBeInTheDocument();
    });

    it("omits the worst match when it is null", () => {
      renderRoast({ worstMatch: null }, {}, still);
      expect(screen.queryByText(/Worst night/)).not.toBeInTheDocument();
    });

    it("uses the hero name of the worst match", () => {
      renderRoast({ worstMatch: { matchId: 1, heroId: 10, deaths: 14 } }, {}, still);
      expect(screen.getByText("Worst night: 14 deaths as Paradox")).toBeInTheDocument();
    });

    it("keeps the fixed headline and says so in the body when there are no deaths at all", () => {
      renderRoast({ deaths: 0, deathPositions: [], worstMatch: null }, {}, still);
      expect(screen.getByRole("heading", { name: headlineFor("roast") })).toBeInTheDocument();
      expect(screen.getByText(/not a single death/i)).toBeInTheDocument();
    });

    it("leaves out the worst night when it had no deaths (a zero-death player)", () => {
      renderRoast(
        { deaths: 0, deathPositions: [], worstMatch: { matchId: 1, heroId: 1, deaths: 0 } },
        {},
        still,
      );
      expect(screen.queryByText(/Worst night/)).not.toBeInTheDocument();
    });
  });

  describe("unspent souls", () => {
    const sentence = () => screen.getByTestId("unspent-souls");

    it("shows the neutral sentence, with no number and no unit, until the unit is accepted (#36)", () => {
      renderRoast({}, {}, still);
      expect(sentence()).toHaveTextContent(UNSPENT_NEUTRAL_LINE);
      expect(sentence().textContent).not.toMatch(/\d/);
    });

    it("never claims minutes", () => {
      renderRoast({}, {}, still);
      expect(sentence().textContent).not.toMatch(/minute/i);
    });

    it("shows a neutral sentence with no number when the stash cannot be worked out", () => {
      renderRoast({ avgUnspentGoldMinutes: 0 }, {}, still);
      expect(sentence().textContent).not.toMatch(/\d/);
      expect(sentence().textContent).not.toMatch(/minute/i);
    });

    it("is neutral too when there is no play time to divide by", () => {
      const base = fixtureStory();
      renderRoast({}, { intro: { ...base.intro, hoursPlayed: 0 } }, still);
      expect(within(sentence()).queryByText(/\d/)).not.toBeInTheDocument();
    });
  });
});
