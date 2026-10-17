import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { WorldLayer } from "@/components/world/WorldLayer";
import { ndjson, setup, storyEvent, storyUp } from "./app-harness";

vi.mock("@/components/world/WorldCanvas", () => ({
  default: ({ story }: { story?: unknown }) => (
    <div data-testid="world-canvas" data-scenery={story === undefined} />
  ),
}));

// jsdom has no WebGL; pretend it does so the 3D city (mocked above) is what gets drawn.
vi.mock("@/lib/client/graphics", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/client/graphics")>()),
  supportsWebGL: () => true,
}));

/** The landing page has the city behind it too, with no story yet to follow. */
describe("the world on the landing page", () => {
  beforeEach(() => {
    vi.spyOn(navigator, "hardwareConcurrency", "get").mockReturnValue(8);
  });
  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("puts the city behind the entry screen", () => {
    setup();
    expect(screen.getByLabelText("Paste your Steam profile URL")).toBeInTheDocument();
    expect(screen.getByTestId("world")).toHaveAttribute("aria-hidden", "true");
  });

  it("keeps the same city behind the loading screen", async () => {
    const { enter } = setup(new Promise<Response>(() => {}));
    const world = screen.getByTestId("world");
    await enter();
    // By text: with WebGL on, the graphics note is a second (empty) status region.
    expect((await screen.findAllByText(/Looking up your ledger/)).length).toBeGreaterThan(0);
    expect(screen.getByTestId("world")).toBe(world);
  });

  it("keeps the same city when the story starts, and hands it the story to follow", async () => {
    const { enter } = setup(ndjson(storyEvent()));
    const world = screen.getByTestId("world");
    const canvas = await screen.findByTestId("world-canvas");
    await enter();
    await storyUp();
    expect(screen.getByTestId("world")).toBe(world);
    // The same canvas throughout: never torn down and redrawn (which would blink to black).
    expect(screen.getByTestId("world-canvas")).toBe(canvas);
    expect(canvas).toHaveAttribute("data-scenery", "false");
  });

  it("shows the 3D city as scenery, without a story, straight away", async () => {
    render(<WorldLayer started webgl reducedMotion={false} />);
    expect(await screen.findByTestId("world-canvas")).toHaveAttribute("data-scenery", "true");
  });
});
