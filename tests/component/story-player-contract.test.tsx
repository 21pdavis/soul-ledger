import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { StoryPlayer } from "@/components/story/StoryPlayer";
import { headlineFor } from "@/story/copy";
import type { SlideComponentProps } from "@/components/story/slides";
import { fixtureSlideProps } from "../fixtures/story";
import { clearMedia, mockMedia } from "./media";

// Replace the registry with probes so this file tests what the player hands every slide, whatever
// the real slides become. Each probe shows its props as data attributes and has a Replay button.
vi.mock("@/components/story/slides", async () => {
  const { SLIDES, headlineFor } = await import("@/story/copy");
  const { SlideFrame } = await import("@/components/story/SlideFrame");
  const probe = (id: (typeof SLIDES)[number]["id"]) =>
    function Probe(props: SlideComponentProps) {
      return (
        <SlideFrame headline={headlineFor(id)}>
          <div
            data-testid={`probe-${id}`}
            data-active={String(props.active)}
            data-skip={String(props.skipAnimation)}
            data-paused={String(props.paused)}
            data-reduced={String(props.reducedMotion)}
          />
          <button type="button" onClick={props.actions.onReplay}>
            Replay
          </button>
        </SlideFrame>
      );
    };
  return { SLIDE_COMPONENTS: Object.fromEntries(SLIDES.map((s) => [s.id, probe(s.id)])) };
});

afterEach(clearMedia);

const stage = () => screen.getByTestId("story-stage");
const probe = (id: string) => screen.getByTestId(`probe-${id}`);
const press = { pointerId: 1, isPrimary: true, button: 0 };

describe("what the player gives each slide", () => {
  it("tells slides about reduced motion from the user's preference", () => {
    mockMedia();
    const { unmount } = render(<StoryPlayer {...fixtureSlideProps()} />);
    expect(probe("intro")).toHaveAttribute("data-reduced", "false");
    unmount();
    mockMedia({ reduced: true });
    render(<StoryPlayer {...fixtureSlideProps()} />);
    expect(probe("intro")).toHaveAttribute("data-reduced", "true");
  });

  it("marks the current slide active and an exiting slide inactive", async () => {
    mockMedia();
    render(<StoryPlayer {...fixtureSlideProps()} entranceMs={10_000} />);
    expect(probe("intro")).toHaveAttribute("data-active", "true");
    await userEvent.keyboard("{ArrowRight}"); // completes the opening entrance
    await userEvent.keyboard("{ArrowRight}");
    expect(probe("main")).toHaveAttribute("data-active", "true");
    const leaving = screen.queryByTestId("probe-intro");
    if (leaving) expect(leaving).toHaveAttribute("data-active", "false");
  });

  it("asks slides to finish at once when a tap completes the entrance, then resets", async () => {
    mockMedia();
    render(<StoryPlayer {...fixtureSlideProps()} entranceMs={10_000} />);
    expect(probe("intro")).toHaveAttribute("data-skip", "false");
    await userEvent.click(screen.getByTestId("tap-zone-next"));
    expect(probe("intro")).toHaveAttribute("data-skip", "true");
    await userEvent.click(screen.getByTestId("tap-zone-next"));
    expect(probe("main")).toHaveAttribute("data-skip", "false");
  });

  it("tells slides to hold while the reader presses and holds", () => {
    mockMedia();
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
    try {
      render(<StoryPlayer {...fixtureSlideProps()} />);
      const zone = screen.getByTestId("tap-zone-next");
      expect(probe("intro")).toHaveAttribute("data-paused", "false");
      fireEvent.pointerDown(zone, { ...press, clientX: 300 });
      act(() => {
        vi.advanceTimersByTime(300);
      });
      expect(probe("intro")).toHaveAttribute("data-paused", "true");
      fireEvent.pointerUp(zone, { ...press, clientX: 300 });
      expect(probe("intro")).toHaveAttribute("data-paused", "false");
    } finally {
      vi.useRealTimers();
    }
  });
});

describe("Replay", () => {
  it("returns to slide 1 and then calls the app's own onReplay", async () => {
    mockMedia({ scroll: true });
    const onReplay = vi.fn();
    const props = fixtureSlideProps();
    render(<StoryPlayer {...props} actions={{ ...props.actions, onReplay }} entranceMs={1} />);
    await userEvent.click(screen.getByRole("button", { name: "Go to slide 11" }));
    expect(stage()).toHaveAttribute("data-slide", "summary");
    const summary = screen.getByRole("region", { name: headlineFor("summary") });
    await userEvent.click(within(summary).getByRole("button", { name: "Replay" }));
    expect(stage()).toHaveAttribute("data-slide", "intro");
    expect(onReplay).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(screen.getAllByRole("heading")).toHaveLength(1));
  });
});

describe("hydration", () => {
  it("renders no stage on the server, so the slide is never mounted in one controller and then moved", () => {
    mockMedia({ scroll: true });
    const html = renderToString(<StoryPlayer {...fixtureSlideProps()} />);
    expect(html).not.toContain("story-stage");
    expect(html).not.toContain("probe-intro");
  });
});
