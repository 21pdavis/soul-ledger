import { fireEvent, render, screen, within, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { heroArtSrc } from "@/components/story/HeroTile";
import { KillsSlide } from "@/components/story/slides/KillsSlide";
import { KILLS_COPY, headlineFor } from "@/story/copy";
import { fixtureSlideProps, fixtureStory } from "../fixtures/story";

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

function renderWithNemesis(nemesis: ReturnType<typeof fixtureStory>["nemesis"]) {
  const story = fixtureStory();
  return render(
    <KillsSlide
      {...fixtureSlideProps({ story: { ...story, nemesis } })}
      {...flags}
      reducedMotion
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

  it("shows one fixed line, whatever the data (ADR 0053)", () => {
    renderKills({ bullet: 1, ability: 900, melee: 2 }, { reducedMotion: true });
    expect(screen.getByText(KILLS_COPY.line)).toBeInTheDocument();
  });

  it("reads 'kill', not '1 kills', for exactly one", () => {
    renderKills({ total: 1 }, { reducedMotion: true });
    expect(screen.getByText("kill on the ledger")).toBeInTheDocument();
    expect(screen.queryByText("kills on the ledger")).toBeNull();
  });

  it("sets headshots apart as a subset of bullet kills, right under bullets", () => {
    renderKills({}, { reducedMotion: true });
    const rows = screen.getAllByTestId(/^kill-row-/).map((r) => r.dataset.testid);
    expect(rows).toEqual([
      "kill-row-bullet",
      "kill-row-headshot",
      "kill-row-ability",
      "kill-row-melee",
    ]);
    expect(row("headshot")).toHaveAttribute("data-subset", "true");
    expect(row("bullet")).not.toHaveAttribute("data-subset");
  });

  it("shows the bullet, ability, melee and headshot breakdown as real text", () => {
    renderKills({}, { reducedMotion: true });
    expect(within(row("bullet")).getByText("Bullets")).toBeInTheDocument();
    expect(within(row("bullet")).getByText("900")).toBeInTheDocument();
    expect(within(row("ability")).getByText("Abilities")).toBeInTheDocument();
    expect(within(row("ability")).getByText("400")).toBeInTheDocument();
    expect(within(row("melee")).getByText("Melee")).toBeInTheDocument();
    expect(within(row("melee")).getByText("100")).toBeInTheDocument();
    expect(within(row("headshot")).getByText("of which headshots")).toBeInTheDocument();
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
    expect(screen.getByText(KILLS_COPY.line)).toBeInTheDocument();
    expect(container.textContent).not.toMatch(/NaN|Infinity/);
    expect(container.innerHTML).not.toMatch(/NaN|Infinity/);
  });

  describe("nemesis (the hero that killed the reader most, ADR 0068)", () => {
    it("names the nemesis with their picture and how often they killed the reader", () => {
      renderWithNemesis({ heroId: 15, kills: 12 });
      const blurb = screen.getByTestId("kill-nemesis");
      expect(blurb).toHaveTextContent("Your nemesis");
      expect(within(blurb).getByText("Bebop")).toBeInTheDocument();
      expect(blurb).toHaveTextContent("killed you 12 times");
      expect(blurb.querySelector("img")).toHaveAttribute("src", heroArtSrc(15, "sm"));
    });

    it("says 'once', not '1 times', for a single kill", () => {
      renderWithNemesis({ heroId: 15, kills: 1 });
      expect(screen.getByTestId("kill-nemesis")).toHaveTextContent("killed you once");
    });

    it("falls back to the hero's initials when the picture fails to load", () => {
      renderWithNemesis({ heroId: 15, kills: 12 });
      const blurb = screen.getByTestId("kill-nemesis");
      fireEvent.error(blurb.querySelector("img")!);
      expect(blurb.querySelector("img")).toBeNull();
      expect(within(blurb).getByText("Bebop")).toBeInTheDocument();
    });

    it("names no one while the killers are still unknown (no stand-in rival)", () => {
      renderWithNemesis(null);
      expect(screen.queryByTestId("kill-nemesis")).toBeNull();
      expect(screen.queryByText(/nemesis/i)).toBeNull();
    });
  });

  describe("entrance", () => {
    it("counts up from 0 and lands on the final values inside the entrance window", async () => {
      renderKills();
      expect(within(screen.getByTestId("kill-total")).getByText("0")).toBeInTheDocument();
      expect(screen.getByTestId("kill-slide")).toHaveAttribute("data-animate", "true");
      await waitFor(
        () =>
          expect(within(screen.getByTestId("kill-total")).getByText("1,500")).toBeInTheDocument(),
        { timeout: 1500 },
      );
      await waitFor(() => expect(within(row("bullet")).getByText("900")).toBeInTheDocument(), {
        timeout: 1500,
      });
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

    it("holds while the reader presses and holds", async () => {
      renderKills({}, { paused: true });
      await new Promise((r) => setTimeout(r, 400));
      expect(within(screen.getByTestId("kill-total")).getByText("0")).toBeInTheDocument();
    });
  });
});
