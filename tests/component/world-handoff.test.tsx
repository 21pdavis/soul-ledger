import { act, cleanup, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { SlideProps } from "@/story/types";
import { ndjson, setup, storyEvent } from "./app-harness";

// A stand-in story whose slide reports are pressed by hand, so the hand-over can be timed.
vi.mock("@/components/app/StoryStage", () => ({
  StoryStage: ({
    actions,
    onSlideChange,
  }: SlideProps & { onSlideChange?: (s: number) => void }) => (
    <div>
      <p>stand-in story</p>
      <button onClick={() => onSlideChange?.(3)}>Report slide 3</button>
      <button onClick={actions.onRefresh}>Refresh</button>
    </div>
  ),
}));
vi.mock("@/components/world/WorldCanvas", () => ({
  default: ({ story }: { story?: unknown }) => (
    <div data-testid="world-canvas" data-scenery={story === undefined} />
  ),
}));
vi.mock("@/lib/client/graphics", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/client/graphics")>()),
  supportsWebGL: () => true,
}));

/** When the city is handed the story (ADR 0077): only once this story's first card is up. */
describe("handing the city the story", () => {
  const idle: (() => void)[] = [];
  const flushIdle = () => act(() => idle.splice(0).forEach((cb) => cb()));
  beforeEach(() => {
    vi.spyOn(navigator, "hardwareConcurrency", "get").mockReturnValue(8);
    vi.stubGlobal("requestIdleCallback", (cb: () => void) => idle.push(cb));
    vi.stubGlobal("cancelIdleCallback", () => {});
  });
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    localStorage.clear();
    idle.length = 0;
  });

  it("waits for the refreshed story's own first card, not the old story's slide", async () => {
    const { enter, user } = setup(ndjson(storyEvent()), ndjson(storyEvent()));
    await enter();
    await screen.findByText("stand-in story");
    await user.click(screen.getByRole("button", { name: "Report slide 3" }));
    flushIdle();
    expect(screen.getByTestId("world-canvas")).toHaveAttribute("data-scenery", "false");

    await user.click(screen.getByRole("button", { name: "Refresh" }));
    await screen.findByText("stand-in story");
    // The new story is up, but its player has not reported a slide yet.
    flushIdle();
    expect(screen.getByTestId("world-canvas")).toHaveAttribute("data-scenery", "true");
  });
});
