import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { WorldLayer } from "@/components/world/WorldLayer";
import { GRAPHICS_KEY } from "@/lib/client/graphics";
import { fixtureStory } from "../fixtures/story";

// The real canvas needs WebGL, which jsdom lacks; a stand-in shows where it would mount.
vi.mock("@/components/world/WorldCanvas", () => ({
  default: ({ slide }: { slide: number }) => <div data-testid="world-canvas" data-slide={slide} />,
}));

/**
 * The world behind the story (ADR 0068): 3D only once the story has started and only when the
 * graphics level allows it; otherwise (Off, or no WebGL) a still picture of the city.
 */
describe("WorldLayer", () => {
  afterEach(() => localStorage.clear());

  it("shows the still picture, not the canvas, without WebGL", async () => {
    render(
      <WorldLayer story={fixtureStory()} slide={0} started webgl={false} reducedMotion={false} />,
    );
    expect(screen.getByTestId("world")).toHaveAttribute("data-level", "off");
    expect(screen.getByTestId("world-still")).toBeInTheDocument();
    expect(screen.queryByTestId("world-canvas")).not.toBeInTheDocument();
  });

  it("waits for the story to start before mounting the 3D", async () => {
    const { rerender } = render(
      <WorldLayer story={fixtureStory()} slide={0} started={false} webgl reducedMotion={false} />,
    );
    expect(screen.getByTestId("world")).toHaveAttribute("data-level", "full");
    expect(screen.queryByTestId("world-canvas")).not.toBeInTheDocument();
    rerender(<WorldLayer story={fixtureStory()} slide={2} started webgl reducedMotion={false} />);
    expect(await screen.findByTestId("world-canvas")).toHaveAttribute("data-slide", "2");
  });

  it("starts on Off for reduced motion, and a saved level wins", async () => {
    const { unmount } = render(
      <WorldLayer story={fixtureStory()} slide={0} started webgl reducedMotion />,
    );
    expect(screen.getByTestId("world")).toHaveAttribute("data-level", "off");
    unmount();
    localStorage.setItem(GRAPHICS_KEY, "full");
    render(<WorldLayer story={fixtureStory()} slide={0} started webgl reducedMotion />);
    expect(screen.getByTestId("world")).toHaveAttribute("data-level", "full");
    expect(await screen.findByTestId("world-canvas")).toBeInTheDocument();
  });
});
