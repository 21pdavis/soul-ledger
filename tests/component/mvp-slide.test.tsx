import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MvpSlide } from "@/components/story/slides/MvpSlide";
import type { SlideComponentProps } from "@/components/story/slides";
import { MVP_FALLBACK_LEAD, headlineFor } from "@/story/copy";
import type { StoryData } from "@/story/types";
import { fixtureSlideProps, fixtureStory } from "../fixtures/story";

const motion = { active: true, skipAnimation: false, reducedMotion: false, paused: false };

const stat = (metric: string, label: string, topPercent: number) => ({
  metric,
  label,
  value: 10,
  percentile: 100 - topPercent,
  topPercent,
  higherIsBetter: true,
  weight: 1,
});

function renderMvp(
  story: StoryData,
  flags: Partial<Pick<SlideComponentProps, "skipAnimation" | "reducedMotion" | "paused">> = {},
) {
  return render(<MvpSlide {...fixtureSlideProps({ story })} {...motion} {...flags} />);
}

describe("MvpSlide", () => {
  it.each([
    ["active", {}, "rise"],
    ["skipAnimation", { skipAnimation: true }, "none"],
    ["reducedMotion", { reducedMotion: true }, "none"],
  ])(
    "the MVP slide reveals with entrance motion only when it should (%s)",
    (_n, flags, expected) => {
      const { container } = renderMvp(fixtureStory(), flags);
      const steps = [...container.querySelectorAll("[data-motion]")];
      expect(steps.length).toBeGreaterThan(0);
      for (const el of steps) expect(el).toHaveAttribute("data-motion", expected);
    },
  );

  it.each([
    ["active", {}],
    ["skipAnimation", { skipAnimation: true }],
    ["reducedMotion", { reducedMotion: true }],
    ["paused", { paused: true }],
  ])("renders the hero-scope stat as DOM text (%s)", (_n, flags) => {
    renderMvp(fixtureStory(), flags);
    expect(screen.getByRole("heading", { name: headlineFor("mvp") })).toBeInTheDocument();
    expect(screen.getByText("Melee kills")).toBeInTheDocument();
    expect(screen.getByText("Top 0.5%")).toBeInTheDocument();
    expect(screen.getByText("of Infernus players")).toBeInTheDocument();
  });

  it("uses the hero name for the hero scope and shows a monogram tile for it", () => {
    renderMvp(
      fixtureStory({ mvp: { ...stat("melee", "Melee kills", 3), scope: "hero", heroId: 10 } }),
      { reducedMotion: true },
    );
    expect(screen.getByText("of Paradox players")).toBeInTheDocument();
    expect(screen.getByTestId("hero-monogram")).toHaveTextContent("P");
  });

  it("for the global scope, never mentions a hero", () => {
    const { container } = renderMvp(
      fixtureStory({ mvp: { ...stat("kills", "Kills", 4), scope: "global" } }),
      { reducedMotion: true },
    );
    expect(screen.getByRole("heading", { name: headlineFor("mvp") })).toBeInTheDocument();
    expect(screen.getByText("Kills")).toBeInTheDocument();
    expect(screen.getByText("Top 4%")).toBeInTheDocument();
    expect(screen.getByText("of all players")).toBeInTheDocument();
    expect(container.textContent).not.toMatch(/Infernus|Hero #/);
    expect(screen.queryByTestId("hero-monogram")).not.toBeInTheDocument();
  });

  it("shows the best global stat with neutral copy when the signature stat is above 50", () => {
    const { container } = renderMvp(
      fixtureStory({
        mvp: { ...stat("deaths", "Deaths", 61), scope: "hero", heroId: 1 },
        percentiles: [stat("kills", "Kills", 72), stat("assists", "Assists", 58)],
      }),
      { reducedMotion: true },
    );
    expect(screen.getByRole("heading", { name: headlineFor("mvp") })).toBeInTheDocument();
    expect(screen.getByText(MVP_FALLBACK_LEAD)).toBeInTheDocument();
    expect(screen.getByText("Assists")).toBeInTheDocument();
    expect(screen.getByText("Top 58%")).toBeInTheDocument();
    expect(screen.getByText("of all players")).toBeInTheDocument();
    expect(container.textContent).not.toMatch(/Infernus|Hero #|Deaths/);
    expect(screen.queryByTestId("hero-monogram")).not.toBeInTheDocument();
  });

  it("has its own friendly copy when mvp is null", () => {
    renderMvp(fixtureStory({ mvp: null, percentiles: [] }), { reducedMotion: true });
    expect(screen.getByRole("heading", { name: headlineFor("mvp") })).toBeInTheDocument();
    expect(screen.getByText(/play a few more matches/i)).toBeInTheDocument();
    expect(screen.queryByText(/^Top /)).not.toBeInTheDocument();
  });

  it("falls back to the friendly copy if the fallback has no global stat either", () => {
    renderMvp(
      fixtureStory({ mvp: { ...stat("kills", "Kills", 80), scope: "global" }, percentiles: [] }),
      { reducedMotion: true },
    );
    expect(screen.getByRole("heading", { name: headlineFor("mvp") })).toBeInTheDocument();
    expect(screen.getByText(/play a few more matches/i)).toBeInTheDocument();
  });
});
