import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { StoryStage } from "@/components/app/StoryStage";
import { StoryPlayer } from "@/components/story/StoryPlayer";
import { CARD_SIDES } from "@/story/card-sides";
import { fixtureSlideProps } from "../fixtures/story";
import { clearMedia, mockMedia } from "./media";

vi.mock("@/components/world/WorldCanvas", () => ({
  default: ({ slide }: { slide: number }) => <div data-testid="world-canvas" data-slide={slide} />,
}));

/** The story with the 3D world behind it (ADR 0068, 0069). */
describe("story and world", () => {
  beforeEach(() => {
    mockMedia({ scroll: true });
    vi.spyOn(HTMLElement.prototype, "clientHeight", "get").mockReturnValue(800);
    Element.prototype.scrollTo = vi.fn() as unknown as typeof Element.prototype.scrollTo;
  });
  afterEach(() => {
    clearMedia();
    vi.restoreAllMocks();
  });

  it("marks the player when a world is behind it, and only then", async () => {
    const { unmount } = render(<StoryPlayer {...fixtureSlideProps()} world />);
    await waitFor(() =>
      expect(screen.getByTestId("story-player")).toHaveAttribute("data-world", "on"),
    );
    unmount();
    render(<StoryPlayer {...fixtureSlideProps()} />);
    await waitFor(() =>
      expect(screen.getByTestId("story-player")).toHaveAttribute("data-mode", "scroll"),
    );
    expect(screen.getByTestId("story-player")).not.toHaveAttribute("data-world");
  });

  it("gives each desktop card its side, alternating so the scene shows beside it", async () => {
    render(<StoryPlayer {...fixtureSlideProps()} world />);
    const cards = await screen.findAllByTestId("story-card");
    expect(cards.map((c) => c.getAttribute("data-side"))).toEqual(CARD_SIDES);
    expect(CARD_SIDES.slice(0, 3)).toEqual(["left", "right", "left"]);
  });

  it("reports the current slide so the app's city can follow it", async () => {
    const onSlideChange = vi.fn();
    render(<StoryStage {...fixtureSlideProps()} onSlideChange={onSlideChange} />);
    await waitFor(() => expect(onSlideChange).toHaveBeenCalledWith(0));
    expect(screen.getByTestId("story-player")).toHaveAttribute("data-world", "on");
  });
});
