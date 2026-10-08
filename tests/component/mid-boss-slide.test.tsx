import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MidBossSlide } from "@/components/story/slides/MidBossSlide";
import { headlineFor } from "@/story/copy";
import { fixtureSlideProps, fixtureStory } from "../fixtures/story";

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
    expect(screen.getByText("12")).toBeInTheDocument();
    expect(screen.getByText("Rejuvenators claimed by your team")).toBeInTheDocument();
  });

  it("uses the singular for exactly one", () => {
    renderMidBoss({ claimed: 1, stolen: 0 });
    expect(screen.getByText("Rejuvenator claimed by your team")).toBeInTheDocument();
  });

  it("shows the stolen line only when stolen is above 0", () => {
    const { unmount } = renderMidBoss({ claimed: 12, stolen: 2 });
    expect(screen.getByText(/Stolen by your team: 2/)).toBeInTheDocument();
    unmount();
    renderMidBoss({ claimed: 12, stolen: 0 });
    expect(screen.queryByText(/stolen/i)).toBeNull();
  });

  it("never shows a steal next to 0 claimed (stolen is a subset of claimed)", () => {
    renderMidBoss({ claimed: 0, stolen: 3 });
    expect(screen.queryByText(/stolen/i)).toBeNull();
  });

  it("shows friendly in-voice copy, not an empty stat, with 0 claimed", () => {
    renderMidBoss({ claimed: 0, stolen: 0 });
    expect(screen.getByText(/no rejuvenators claimed by your team yet/i)).toBeInTheDocument();
    expect(screen.getByText(/mid boss is still waiting/i)).toBeInTheDocument();
    expect(screen.queryByText("0")).toBeNull();
    expect(screen.getByTestId("midboss-slide")).toHaveAttribute("data-claimed", "false");
  });

  describe("entrance", () => {
    it("counts up and lands on the final value inside the entrance window", async () => {
      renderMidBoss({ claimed: 12, stolen: 2 }, { reducedMotion: false });
      expect(screen.getByText("0")).toBeInTheDocument();
      await waitFor(() => expect(screen.getByText("12")).toBeInTheDocument(), { timeout: 1500 });
    });

    it("shows the final value at once on skipAnimation and under reduced motion", () => {
      const { unmount } = renderMidBoss(
        { claimed: 12, stolen: 2 },
        { reducedMotion: false, skipAnimation: true },
      );
      expect(screen.getByText("12")).toBeInTheDocument();
      expect(screen.getByTestId("midboss-slide")).toHaveAttribute("data-animate", "false");
      unmount();
      renderMidBoss({ claimed: 12, stolen: 2 }, { reducedMotion: true });
      expect(screen.getByText("12")).toBeInTheDocument();
      expect(screen.getByTestId("midboss-slide")).toHaveAttribute("data-animate", "false");
    });

    it("holds while the reader presses and holds", async () => {
      renderMidBoss({ claimed: 12, stolen: 2 }, { reducedMotion: false, paused: true });
      await new Promise((r) => setTimeout(r, 400));
      expect(screen.getByText("0")).toBeInTheDocument();
    });
  });
});
