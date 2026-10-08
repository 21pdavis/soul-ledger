import { act, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MidBossSlide } from "@/components/story/slides/MidBossSlide";
import { headlineFor } from "@/story/copy";
import { fixtureSlideProps, fixtureStory } from "../fixtures/story";

afterEach(() => vi.useRealTimers());

const flags = { active: true, skipAnimation: false, reducedMotion: true, paused: false };

function renderMidBoss(
  midBoss: ReturnType<typeof fixtureStory>["midBoss"],
  extra: Partial<typeof flags> = {},
) {
  return render(
    <MidBossSlide
      {...fixtureSlideProps({ story: fixtureStory({ midBoss }) })}
      {...flags}
      {...extra}
    />,
  );
}

describe("MidBossSlide", () => {
  it("shows the headline, the claimed count and its label", () => {
    renderMidBoss({ claimed: 12, stolen: 0 });
    expect(screen.getByRole("heading", { name: headlineFor("midBoss") })).toBeInTheDocument();
    expect(screen.getByTestId("kill-stat")).toHaveTextContent("12");
    expect(screen.getByText("Rejuvenators claimed")).toBeInTheDocument();
  });

  it("uses the singular for exactly one", () => {
    renderMidBoss({ claimed: 1, stolen: 0 });
    expect(screen.getByText("Rejuvenator claimed")).toBeInTheDocument();
  });

  it("shows the stolen line only when stolen is above 0", () => {
    const { unmount } = renderMidBoss({ claimed: 12, stolen: 2 });
    expect(screen.getByText(/Stolen: 2/)).toBeInTheDocument();
    unmount();
    renderMidBoss({ claimed: 12, stolen: 0 });
    expect(screen.queryByText(/stolen/i)).toBeNull();
  });

  it("shows friendly in-voice copy, not an empty stat, with 0 claimed", () => {
    renderMidBoss({ claimed: 0, stolen: 0 });
    expect(screen.getByText(/no rejuvenators claimed yet/i)).toBeInTheDocument();
    expect(screen.getByText(/mid boss is still waiting/i)).toBeInTheDocument();
    expect(screen.queryByTestId("kill-stat")).toBeNull();
    expect(screen.getByTestId("midboss-slide")).toHaveAttribute("data-claimed", "false");
  });

  it("still mentions a steal when nothing was claimed but something was stolen", () => {
    renderMidBoss({ claimed: 0, stolen: 3 });
    expect(screen.getByText(/Stolen: 3/)).toBeInTheDocument();
  });

  describe("entrance", () => {
    it("counts up and lands on the final value inside the entrance window", () => {
      vi.useFakeTimers();
      renderMidBoss({ claimed: 12, stolen: 2 }, { reducedMotion: false });
      expect(screen.getByTestId("kill-stat")).toHaveTextContent("0");
      act(() => vi.advanceTimersByTime(800));
      expect(screen.getByTestId("kill-stat")).toHaveTextContent("12");
    });

    it("shows the final value at once on skipAnimation and under reduced motion", () => {
      const { unmount } = renderMidBoss(
        { claimed: 12, stolen: 2 },
        { reducedMotion: false, skipAnimation: true },
      );
      expect(screen.getByTestId("kill-stat")).toHaveTextContent("12");
      expect(screen.getByTestId("midboss-slide")).toHaveAttribute("data-animate", "false");
      unmount();
      renderMidBoss({ claimed: 12, stolen: 2 }, { reducedMotion: true });
      expect(screen.getByTestId("kill-stat")).toHaveTextContent("12");
      expect(screen.getByTestId("midboss-slide")).toHaveAttribute("data-animate", "false");
    });

    it("holds while the reader presses and holds", () => {
      vi.useFakeTimers();
      renderMidBoss({ claimed: 12, stolen: 2 }, { reducedMotion: false, paused: true });
      act(() => vi.advanceTimersByTime(2000));
      expect(screen.getByTestId("kill-stat")).toHaveTextContent("0");
    });
  });
});
