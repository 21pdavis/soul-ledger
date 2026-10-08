import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { StoryPlayer } from "@/components/story/StoryPlayer";
import { SLIDES } from "@/story/copy";
import { fixtureSlideProps } from "../fixtures/story";
import { clearMedia, mockMedia } from "./media";

const headline = (i: number) => SLIDES[i].headline;
const tapRight = () => userEvent.click(screen.getByTestId("tap-zone-next"));
const tapLeft = () => userEvent.click(screen.getByTestId("tap-zone-back"));
const stage = () => screen.getByTestId("story-stage");
const settle = () => waitFor(() => expect(stage()).toHaveAttribute("data-animating", "false"));
const onSlide = (i: number) =>
  waitFor(() => {
    expect(screen.getAllByRole("heading", { name: headline(i) }).length).toBeGreaterThan(0);
    expect(stage()).toHaveAttribute("data-slide", SLIDES[i].id);
  });

describe("StoryPlayer, tap mode (phone)", () => {
  beforeEach(() => mockMedia());
  afterEach(clearMedia);

  it("defaults to tap mode and starts on slide 1 with a read-only 11-segment progress bar", () => {
    render(<StoryPlayer {...fixtureSlideProps()} />);
    expect(screen.getByTestId("story-player")).toHaveAttribute("data-mode", "tap");
    expect(screen.getByRole("heading", { name: headline(0) })).toBeInTheDocument();
    const items = within(screen.getByRole("list", { name: "Story progress" })).getAllByRole(
      "listitem",
    );
    expect(items).toHaveLength(11);
    expect(items[0]).toHaveAttribute("data-state", "current");
    expect(screen.queryByRole("button", { name: /Go to slide/ })).not.toBeInTheDocument();
  });

  it("tapping the right side advances and the left side goes back", async () => {
    render(<StoryPlayer {...fixtureSlideProps()} />);
    await tapRight();
    await onSlide(1);
    await settle();
    await tapRight();
    await onSlide(2);
    await settle();
    await tapLeft();
    await onSlide(1);
    const items = within(screen.getByRole("list", { name: "Story progress" })).getAllByRole(
      "listitem",
    );
    expect(items[1]).toHaveAttribute("data-state", "current");
    expect(items[0]).toHaveAttribute("data-state", "done");
  });

  it("back on the first slide does nothing", async () => {
    render(<StoryPlayer {...fixtureSlideProps()} />);
    await tapLeft();
    expect(stage()).toHaveAttribute("data-slide", "intro");
  });

  it("a tap while the slide is still animating completes it without advancing", async () => {
    render(<StoryPlayer {...fixtureSlideProps()} />);
    await tapRight();
    expect(stage()).toHaveAttribute("data-slide", "main");
    expect(stage()).toHaveAttribute("data-animating", "true");
    await tapRight(); // completes the animation only
    expect(stage()).toHaveAttribute("data-slide", "main");
    expect(stage()).toHaveAttribute("data-animating", "false");
    await tapRight(); // now it advances
    expect(stage()).toHaveAttribute("data-slide", "roster");
  });

  it("settles on its own once the entrance window has passed", async () => {
    render(<StoryPlayer {...fixtureSlideProps()} entranceMs={30} />);
    await tapRight();
    await settle();
    await tapRight();
    expect(stage()).toHaveAttribute("data-slide", "roster");
  });

  it("ArrowRight and Space go next, ArrowLeft goes back", async () => {
    render(<StoryPlayer {...fixtureSlideProps()} entranceMs={1} />);
    await userEvent.keyboard("{ArrowRight}");
    await onSlide(1);
    await settle();
    await userEvent.keyboard(" ");
    await onSlide(2);
    await settle();
    await userEvent.keyboard("{ArrowLeft}");
    await onSlide(1);
  });

  it("offers visually hidden previous and next buttons that take a focus ring", async () => {
    render(<StoryPlayer {...fixtureSlideProps()} entranceMs={1} />);
    await userEvent.click(screen.getByRole("button", { name: "Next slide" }));
    await onSlide(1);
    await settle();
    await userEvent.click(screen.getByRole("button", { name: "Previous slide" }));
    await onSlide(0);
  });

  it("press and hold pauses and does not navigate", () => {
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
    try {
      render(<StoryPlayer {...fixtureSlideProps()} />);
      const zone = screen.getByTestId("tap-zone-next");
      fireEvent.pointerDown(zone, { pointerId: 1, clientX: 300 });
      expect(stage()).toHaveAttribute("data-paused", "false");
      act(() => {
        vi.advanceTimersByTime(400);
      });
      expect(stage()).toHaveAttribute("data-paused", "true");
      fireEvent.pointerUp(zone, { pointerId: 1, clientX: 300 });
      expect(stage()).toHaveAttribute("data-paused", "false");
      expect(stage()).toHaveAttribute("data-slide", "intro");
    } finally {
      vi.useRealTimers();
    }
  });

  it("a drag away from the press point is not a tap", () => {
    render(<StoryPlayer {...fixtureSlideProps()} />);
    const zone = screen.getByTestId("tap-zone-next");
    fireEvent.pointerDown(zone, { pointerId: 1, clientX: 300 });
    fireEvent.pointerUp(zone, { pointerId: 1, clientX: 80 });
    expect(stage()).toHaveAttribute("data-slide", "intro");
  });

  it("announces each slide change in a polite live region", async () => {
    render(<StoryPlayer {...fixtureSlideProps()} />);
    const live = screen.getByRole("status");
    expect(live).toHaveAttribute("aria-live", "polite");
    expect(live).toHaveTextContent(`Slide 1 of 11: ${headline(0)}`);
    await tapRight();
    expect(live).toHaveTextContent(`Slide 2 of 11: ${headline(1)}`);
  });

  it("renders every slide's content as real DOM text through the whole story", async () => {
    render(<StoryPlayer {...fixtureSlideProps()} entranceMs={1} />);
    for (let i = 0; i < SLIDES.length; i++) {
      await onSlide(i);
      expect(screen.getAllByText("placeholder").length).toBeGreaterThan(0);
      if (i < SLIDES.length - 1) {
        await settle();
        await tapRight();
      }
    }
  });
});

describe("StoryPlayer, reduced motion", () => {
  beforeEach(() => mockMedia({ reduced: true }));
  afterEach(clearMedia);

  it("swaps slides at once with no exit animation, and no tap is spent completing one", async () => {
    render(<StoryPlayer {...fixtureSlideProps()} />);
    await tapRight();
    await waitFor(() => expect(screen.getAllByRole("heading")).toHaveLength(1));
    expect(screen.getByRole("heading", { name: headline(1) })).toBeInTheDocument();
    expect(stage()).toHaveAttribute("data-animating", "false");
    await tapRight();
    expect(stage()).toHaveAttribute("data-slide", "roster");
  });

  it("Space on a focused button presses that button once instead of also advancing", async () => {
    render(<StoryPlayer {...fixtureSlideProps()} />);
    screen.getByRole("button", { name: "Next slide" }).focus();
    await userEvent.keyboard(" ");
    expect(stage()).toHaveAttribute("data-slide", "main");
  });
});
