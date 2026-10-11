import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { StoryPlayer } from "@/components/story/StoryPlayer";
import { fixtureSlideProps } from "../fixtures/story";
import { clearMedia, mockMedia } from "./media";

/**
 * The 3D world follows the story (ADR 0068, 0069): the player reports its current slide to an
 * `onSlideChange` listener, on start and on every move, and never twice in a row for the same one.
 */
describe("StoryPlayer onSlideChange", () => {
  beforeEach(() => mockMedia());
  afterEach(clearMedia);

  const settle = () =>
    waitFor(() =>
      expect(screen.getByTestId("story-stage")).toHaveAttribute("data-animating", "false"),
    );

  it("reports slide 0 when the story starts", async () => {
    const onSlideChange = vi.fn();
    render(<StoryPlayer {...fixtureSlideProps()} entranceMs={20} onSlideChange={onSlideChange} />);
    await waitFor(() => expect(onSlideChange).toHaveBeenCalledWith(0));
  });

  it("reports each new slide as the reader moves, once per change", async () => {
    const onSlideChange = vi.fn();
    render(<StoryPlayer {...fixtureSlideProps()} entranceMs={20} onSlideChange={onSlideChange} />);
    await settle();
    await userEvent.click(screen.getByTestId("tap-zone-next"));
    await waitFor(() => expect(onSlideChange).toHaveBeenLastCalledWith(1));
    await settle();
    await userEvent.click(screen.getByTestId("tap-zone-back"));
    await waitFor(() => expect(onSlideChange).toHaveBeenLastCalledWith(0));
    expect(onSlideChange.mock.calls.map((c) => c[0])).toEqual([0, 1, 0]);
  });
});
