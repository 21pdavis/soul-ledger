import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { StoryPlayer } from "@/components/story/StoryPlayer";
import { fixtureSlideProps } from "../fixtures/story";
import { clearMedia, mockMedia } from "./media";

const VIEWPORT_H = 800;
const stage = () => screen.getByTestId("story-stage");
const track = () => screen.getByTestId("scroll-track");

let scrollTo: ReturnType<typeof vi.fn>;

beforeEach(() => {
  mockMedia({ scroll: true });
  vi.spyOn(HTMLElement.prototype, "clientHeight", "get").mockReturnValue(VIEWPORT_H);
  scrollTo = vi.fn(function (this: HTMLElement, opts: ScrollToOptions) {
    this.scrollTop = opts.top ?? 0;
  });
  Element.prototype.scrollTo = scrollTo as unknown as typeof Element.prototype.scrollTo;
});

afterEach(() => {
  clearMedia();
  vi.restoreAllMocks();
  // @ts-expect-error jsdom has no Element.prototype.scrollTo
  delete Element.prototype.scrollTo;
});

/** Scroll the track to a checkpoint the way a wheel would: set the position, fire scroll. */
function scrollToCheckpoint(i: number) {
  track().scrollTop = i * VIEWPORT_H;
  fireEvent.scroll(track());
}

describe("StoryPlayer, scroll mode (desktop)", () => {
  it("is chosen by a wide viewport with a fine pointer", () => {
    render(<StoryPlayer {...fixtureSlideProps()} />);
    expect(screen.getByTestId("story-player")).toHaveAttribute("data-mode", "scroll");
  });

  it("renders a track of 11 snap checkpoints and a clickable progress bar", () => {
    render(<StoryPlayer {...fixtureSlideProps()} />);
    expect(within(track()).getAllByTestId("checkpoint")).toHaveLength(11);
    expect(screen.getAllByRole("button", { name: /^Go to slide/ })).toHaveLength(11);
    expect(screen.queryByTestId("tap-zone-next")).not.toBeInTheDocument();
  });

  it("arriving at a checkpoint sets the slide once the scroll settles", async () => {
    render(<StoryPlayer {...fixtureSlideProps()} />);
    scrollToCheckpoint(3);
    await waitFor(() => expect(stage()).toHaveAttribute("data-slide", "scavenger"));
    expect(screen.getByRole("status")).toHaveTextContent("Slide 4 of 11");
  });

  it("does not change slide mid-scroll, only at rest", () => {
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
    try {
      render(<StoryPlayer {...fixtureSlideProps()} />);
      track().scrollTop = 2 * VIEWPORT_H;
      fireEvent.scroll(track());
      expect(stage()).toHaveAttribute("data-slide", "intro");
    } finally {
      vi.useRealTimers();
    }
  });

  it("scroll-driven arrival does not scroll again (no feedback loop)", async () => {
    render(<StoryPlayer {...fixtureSlideProps()} />);
    scrollToCheckpoint(4);
    await waitFor(() => expect(stage()).toHaveAttribute("data-slide", "kills"));
    expect(scrollTo).not.toHaveBeenCalled();
  });

  it("a progress-bar click jumps to that slide and the scroll follows", async () => {
    render(<StoryPlayer {...fixtureSlideProps()} />);
    await userEvent.click(screen.getByRole("button", { name: "Go to slide 6" }));
    expect(stage()).toHaveAttribute("data-slide", "precision");
    expect(scrollTo).toHaveBeenCalledWith(expect.objectContaining({ top: 5 * VIEWPORT_H }));
    // the scroll events the jump produces settle on the same slide
    fireEvent.scroll(track());
    await new Promise((r) => setTimeout(r, 200));
    expect(stage()).toHaveAttribute("data-slide", "precision");
    expect(scrollTo).toHaveBeenCalledTimes(1);
  });

  it("a pause partway through a jump's smooth scroll does not count as an arrival", async () => {
    render(<StoryPlayer {...fixtureSlideProps()} />);
    await userEvent.click(screen.getByRole("button", { name: "Go to slide 8" }));
    expect(stage()).toHaveAttribute("data-slide", "roast");
    // The page stalls for over 100ms while still passing checkpoint 3 on the way to 7.
    scrollToCheckpoint(3);
    await new Promise((r) => setTimeout(r, 250));
    expect(stage()).toHaveAttribute("data-slide", "roast");
    // It then reaches the target; and a later scroll by the reader works as normal.
    scrollToCheckpoint(7);
    await new Promise((r) => setTimeout(r, 250));
    expect(stage()).toHaveAttribute("data-slide", "roast");
    scrollToCheckpoint(2);
    await waitFor(() => expect(stage()).toHaveAttribute("data-slide", "roster"));
  });

  it("a jump to a checkpoint the track is merely passing still scrolls there", async () => {
    render(<StoryPlayer {...fixtureSlideProps()} />);
    await userEvent.click(screen.getByRole("button", { name: "Go to slide 8" }));
    expect(scrollTo).toHaveBeenCalledTimes(1);
    // The smooth scroll to 7 is in flight, 40px past checkpoint 3 (nearest checkpoint: 3).
    track().scrollTop = 3 * VIEWPORT_H + 40;
    await userEvent.click(screen.getByRole("button", { name: "Go to slide 4" }));
    expect(stage()).toHaveAttribute("data-slide", "scavenger");
    expect(scrollTo).toHaveBeenCalledTimes(2);
    expect(scrollTo).toHaveBeenLastCalledWith(expect.objectContaining({ top: 3 * VIEWPORT_H }));
  });

  it("keys that do not scroll (Tab) do not end a jump in flight", async () => {
    render(<StoryPlayer {...fixtureSlideProps()} />);
    await userEvent.click(screen.getByRole("button", { name: "Go to slide 8" }));
    scrollToCheckpoint(3); // passing checkpoint 3 on the way
    await userEvent.keyboard("{Tab}");
    await new Promise((r) => setTimeout(r, 250));
    expect(stage()).toHaveAttribute("data-slide", "roast");
  });

  it("scrolling keys (Page Down) hand control back to the reader", async () => {
    render(<StoryPlayer {...fixtureSlideProps()} />);
    await userEvent.click(screen.getByRole("button", { name: "Go to slide 8" }));
    await userEvent.keyboard("{PageDown}");
    scrollToCheckpoint(2);
    await waitFor(() => expect(stage()).toHaveAttribute("data-slide", "roster"));
  });

  it("scrollend is a definite arrival, even where the reader dragged away mid-jump", async () => {
    render(<StoryPlayer {...fixtureSlideProps()} />);
    await userEvent.click(screen.getByRole("button", { name: "Go to slide 8" }));
    // A scrollbar drag during the jump, ending on checkpoint 4: no wheel or pointer event fired.
    track().scrollTop = 4 * VIEWPORT_H;
    fireEvent(track(), new Event("scrollend"));
    expect(stage()).toHaveAttribute("data-slide", "kills");
  });

  it("scrollend at the jump's own target changes nothing", async () => {
    render(<StoryPlayer {...fixtureSlideProps()} />);
    await userEvent.click(screen.getByRole("button", { name: "Go to slide 8" }));
    track().scrollTop = 7 * VIEWPORT_H;
    fireEvent(track(), new Event("scrollend"));
    expect(stage()).toHaveAttribute("data-slide", "roast");
    // and the jump is over: the reader's next scroll is an ordinary arrival
    scrollToCheckpoint(2);
    await waitFor(() => expect(stage()).toHaveAttribute("data-slide", "roster"));
  });

  it("reader input (wheel) during a jump hands control back to the reader", async () => {
    render(<StoryPlayer {...fixtureSlideProps()} />);
    await userEvent.click(screen.getByRole("button", { name: "Go to slide 8" }));
    fireEvent.wheel(track());
    scrollToCheckpoint(2);
    await waitFor(() => expect(stage()).toHaveAttribute("data-slide", "roster"));
  });

  it("arrow keys and space jump a slide at a time and the scroll follows", async () => {
    render(<StoryPlayer {...fixtureSlideProps()} />);
    await userEvent.keyboard("{ArrowRight}");
    expect(stage()).toHaveAttribute("data-slide", "main");
    expect(scrollTo).toHaveBeenLastCalledWith(expect.objectContaining({ top: VIEWPORT_H }));
    // keyboard jumps are never swallowed by a still-running entrance
    await userEvent.keyboard(" ");
    expect(stage()).toHaveAttribute("data-slide", "roster");
    expect(scrollTo).toHaveBeenLastCalledWith(expect.objectContaining({ top: 2 * VIEWPORT_H }));
    await userEvent.keyboard("{ArrowLeft}");
    expect(stage()).toHaveAttribute("data-slide", "main");
    expect(scrollTo).toHaveBeenLastCalledWith(expect.objectContaining({ top: VIEWPORT_H }));
  });

  it("the first and last slide are the ends: arrows past them do nothing", async () => {
    render(<StoryPlayer {...fixtureSlideProps()} />);
    await userEvent.keyboard("{ArrowLeft}");
    expect(stage()).toHaveAttribute("data-slide", "intro");
    await userEvent.click(screen.getByRole("button", { name: "Go to slide 11" }));
    await userEvent.keyboard("{ArrowRight}");
    expect(stage()).toHaveAttribute("data-slide", "summary");
  });

  it("jumps instantly rather than smoothly under reduced motion", async () => {
    clearMedia();
    mockMedia({ scroll: true, reduced: true });
    render(<StoryPlayer {...fixtureSlideProps()} />);
    await userEvent.keyboard("{ArrowRight}");
    expect(scrollTo).toHaveBeenLastCalledWith(expect.objectContaining({ behavior: "auto" }));
  });

  it("announces slide changes in the live region", async () => {
    render(<StoryPlayer {...fixtureSlideProps()} />);
    await userEvent.keyboard("{ArrowRight}");
    expect(screen.getByRole("status")).toHaveTextContent("Slide 2 of 11: Your main");
  });
});
