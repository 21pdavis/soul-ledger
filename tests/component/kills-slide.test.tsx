import { act, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { KillsSlide } from "@/components/story/slides/KillsSlide";
import { headlineFor } from "@/story/copy";
import { fixtureSlideProps, fixtureStory } from "../fixtures/story";

afterEach(() => vi.useRealTimers());

const flags = { active: true, skipAnimation: false, reducedMotion: false, paused: false };

function renderKills(
  kills: Partial<ReturnType<typeof fixtureStory>["kills"]> = {},
  extra: Partial<typeof flags> = {},
) {
  const story = fixtureStory();
  return render(
    <KillsSlide
      {...fixtureSlideProps({ story: { ...story, kills: { ...story.kills, ...kills } } })}
      {...flags}
      {...extra}
    />,
  );
}

const row = (name: string) => screen.getByTestId(`kill-row-${name}`);

describe("KillsSlide", () => {
  it("shows the fixed headline and the kill total", () => {
    renderKills({}, { reducedMotion: true });
    expect(screen.getByRole("heading", { name: headlineFor("kills") })).toBeInTheDocument();
    expect(within(screen.getByTestId("kill-total")).getByText("1,500")).toBeInTheDocument();
    expect(screen.getByText("kills on the ledger")).toBeInTheDocument();
  });

  it("shows the bullet, ability, melee and headshot breakdown as real text", () => {
    renderKills({}, { reducedMotion: true });
    expect(within(row("bullet")).getByText("Bullets")).toBeInTheDocument();
    expect(within(row("bullet")).getByText("900")).toBeInTheDocument();
    expect(within(row("ability")).getByText("Abilities")).toBeInTheDocument();
    expect(within(row("ability")).getByText("400")).toBeInTheDocument();
    expect(within(row("melee")).getByText("Melee")).toBeInTheDocument();
    expect(within(row("melee")).getByText("100")).toBeInTheDocument();
    expect(within(row("headshot")).getByText("Headshots")).toBeInTheDocument();
    expect(within(row("headshot")).getByText("300")).toBeInTheDocument();
  });

  it("draws each row's bar at its share of all kills", () => {
    renderKills({}, { reducedMotion: true });
    expect(within(row("bullet")).getByTestId("kill-bar")).toHaveAttribute("data-share", "0.6");
    expect(within(row("headshot")).getByTestId("kill-bar")).toHaveAttribute("data-share", "0.2");
  });

  it("shows close-up versus long-distance kills", () => {
    renderKills({}, { reducedMotion: true });
    const range = screen.getByTestId("kill-range");
    expect(within(range).getByText("Close-up")).toBeInTheDocument();
    expect(within(range).getByText("700")).toBeInTheDocument();
    expect(within(range).getByText("Long-distance")).toBeInTheDocument();
    expect(within(range).getByText("300")).toBeInTheDocument();
  });

  it("renders with 0 kills: zeros shown, empty bars, friendly line, no NaN", () => {
    const { container } = renderKills(
      { total: 0, bullet: 0, ability: 0, melee: 0, headshot: 0, closeup: 0, longDistance: 0 },
      { reducedMotion: true },
    );
    expect(within(screen.getByTestId("kill-total")).getByText("0")).toBeInTheDocument();
    for (const bar of screen.getAllByTestId("kill-bar")) {
      expect(bar).toHaveAttribute("data-share", "0");
    }
    expect(screen.getByText(/no kills on the ledger yet/i)).toBeInTheDocument();
    expect(container.textContent).not.toMatch(/NaN|Infinity/);
    expect(container.innerHTML).not.toMatch(/NaN|Infinity/);
  });

  describe("entrance", () => {
    it("counts up from 0 and lands on the final values inside the entrance window", () => {
      vi.useFakeTimers();
      renderKills();
      expect(within(screen.getByTestId("kill-total")).getByText("0")).toBeInTheDocument();
      expect(screen.getByTestId("kill-slide")).toHaveAttribute("data-animate", "true");
      act(() => vi.advanceTimersByTime(800));
      expect(within(screen.getByTestId("kill-total")).getByText("1,500")).toBeInTheDocument();
      expect(within(row("bullet")).getByText("900")).toBeInTheDocument();
    });

    it("shows final values at once on skipAnimation", () => {
      renderKills({}, { skipAnimation: true });
      expect(within(screen.getByTestId("kill-total")).getByText("1,500")).toBeInTheDocument();
      expect(screen.getByTestId("kill-slide")).toHaveAttribute("data-animate", "false");
    });

    it("shows final values at once under reduced motion", () => {
      renderKills({}, { reducedMotion: true });
      expect(within(screen.getByTestId("kill-total")).getByText("1,500")).toBeInTheDocument();
      expect(screen.getByTestId("kill-slide")).toHaveAttribute("data-animate", "false");
    });

    it("holds while the reader presses and holds", () => {
      vi.useFakeTimers();
      renderKills({}, { paused: true });
      act(() => vi.advanceTimersByTime(2000));
      expect(within(screen.getByTestId("kill-total")).getByText("0")).toBeInTheDocument();
    });
  });
});
