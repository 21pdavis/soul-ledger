import { act, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PrecisionSlide } from "@/components/story/slides/PrecisionSlide";
import { PARRY_KING_RATE } from "@/lib/stats/story";
import { headlineFor } from "@/story/copy";
import { fixtureSlideProps, fixtureStory } from "../fixtures/story";

afterEach(() => vi.useRealTimers());

const flags = { active: true, skipAnimation: false, reducedMotion: true, paused: false };

function renderPrecision(
  precision: Partial<ReturnType<typeof fixtureStory>["precision"]> = {},
  extra: Partial<typeof flags> = {},
) {
  const story = fixtureStory();
  return render(
    <PrecisionSlide
      {...fixtureSlideProps({
        story: { ...story, precision: { ...story.precision, ...precision } },
      })}
      {...flags}
      {...extra}
    />,
  );
}

describe("PrecisionSlide", () => {
  it("shows the headline, hero accuracy and headshot rate as percentages", () => {
    renderPrecision();
    expect(screen.getByRole("heading", { name: headlineFor("precision") })).toBeInTheDocument();
    const accuracy = screen.getByTestId("dial-accuracy");
    expect(within(accuracy).getByText("46%")).toBeInTheDocument();
    expect(within(accuracy).getByText("Accuracy against heroes")).toBeInTheDocument();
    const headshot = screen.getByTestId("dial-headshot");
    expect(within(headshot).getByText("19%")).toBeInTheDocument();
    expect(within(headshot).getByText("Headshot rate")).toBeInTheDocument();
  });

  it("fills each dial to its rate", () => {
    renderPrecision();
    expect(within(screen.getByTestId("dial-accuracy")).getByTestId("dial-arc")).toHaveAttribute(
      "data-rate",
      "0.46",
    );
  });

  it("shows the parry king badge with the counts and the king line", () => {
    renderPrecision({ parryLabel: "king", parrySuccess: 30, parryMiss: 20 });
    const parry = screen.getByTestId("parry");
    expect(within(parry).getByText("Parry king")).toBeInTheDocument();
    expect(within(parry).getByText("30 landed, 20 missed")).toBeInTheDocument();
    expect(parry).toHaveAttribute("data-label", "king");
    expect(within(parry).getByText(/parry king starts at 60%/i)).toBeInTheDocument();
  });

  it("pins the shown king line to PARRY_KING_RATE", () => {
    renderPrecision({ parryLabel: "king" });
    expect(screen.getByText(new RegExp(`${Math.round(PARRY_KING_RATE * 100)}%`, "i"))).toBeTruthy();
  });

  it("draws the parry meter at the landed rate, with a mark at the king line", () => {
    renderPrecision({ parryLabel: "king", parrySuccess: 30, parryMiss: 20 });
    const meter = screen.getByTestId("parry-meter");
    expect(meter).toHaveAttribute("data-rate", "0.6");
    expect(meter).toHaveAttribute("data-king-rate", String(PARRY_KING_RATE));
  });

  it("shows distinct clown copy with the counts", () => {
    const { unmount } = renderPrecision({ parryLabel: "king", parrySuccess: 30, parryMiss: 20 });
    const kingLine = within(screen.getByTestId("parry")).getByTestId("parry-line").textContent;
    unmount();
    renderPrecision({ parryLabel: "clown", parrySuccess: 10, parryMiss: 40 });
    const parry = screen.getByTestId("parry");
    expect(within(parry).getByText("Parry clown")).toBeInTheDocument();
    expect(within(parry).getByText("10 landed, 40 missed")).toBeInTheDocument();
    expect(parry).toHaveAttribute("data-label", "clown");
    expect(within(parry).getByTestId("parry-line").textContent).not.toBe(kingLine);
  });

  it("shows neutral copy and no badge or counts when the label is none", () => {
    renderPrecision({ parryLabel: "none", parrySuccess: 0, parryMiss: 5 });
    const parry = screen.getByTestId("parry");
    expect(parry).toHaveAttribute("data-label", "none");
    expect(within(parry).getByText(/no parries landed/i)).toBeInTheDocument();
    expect(screen.queryByText(/parry king|parry clown/i)).toBeNull();
    expect(screen.queryByText(/landed, /)).toBeNull();
  });

  it("handles a player with no shots at all (0% everywhere, no NaN)", () => {
    const { container } = renderPrecision({ heroAccuracy: 0, headshotRate: 0, parryLabel: "none" });
    expect(within(screen.getByTestId("dial-accuracy")).getByText("0%")).toBeInTheDocument();
    expect(container.innerHTML).not.toMatch(/NaN|Infinity/);
  });

  describe("entrance", () => {
    it("counts the percentages up and lands on the final values inside the entrance window", () => {
      vi.useFakeTimers();
      renderPrecision({}, { reducedMotion: false });
      expect(within(screen.getByTestId("dial-accuracy")).getByText("0%")).toBeInTheDocument();
      act(() => vi.advanceTimersByTime(800));
      expect(within(screen.getByTestId("dial-accuracy")).getByText("46%")).toBeInTheDocument();
      expect(within(screen.getByTestId("dial-headshot")).getByText("19%")).toBeInTheDocument();
    });

    it("shows final values at once on skipAnimation and under reduced motion", () => {
      const { unmount } = renderPrecision({}, { reducedMotion: false, skipAnimation: true });
      expect(within(screen.getByTestId("dial-accuracy")).getByText("46%")).toBeInTheDocument();
      expect(screen.getByTestId("precision-slide")).toHaveAttribute("data-animate", "false");
      unmount();
      renderPrecision({}, { reducedMotion: true });
      expect(within(screen.getByTestId("dial-accuracy")).getByText("46%")).toBeInTheDocument();
      expect(screen.getByTestId("precision-slide")).toHaveAttribute("data-animate", "false");
    });

    it("holds while the reader presses and holds", () => {
      vi.useFakeTimers();
      renderPrecision({}, { reducedMotion: false, paused: true });
      act(() => vi.advanceTimersByTime(2000));
      expect(within(screen.getByTestId("dial-accuracy")).getByText("0%")).toBeInTheDocument();
    });
  });
});
