import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { WorldLayer } from "@/components/world/WorldLayer";
import { setup } from "./app-harness";

vi.mock("@/components/world/WorldCanvas", () => ({
  default: ({ story }: { story?: unknown }) => (
    <div data-testid="world-canvas" data-scenery={story === undefined} />
  ),
}));

// jsdom has no WebGL: say the browser does, so the page draws the (mocked) city.
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
    expect((await screen.findAllByText(/Looking up your ledger/)).length).toBeGreaterThan(0);
    expect(screen.getByTestId("world")).toBe(world);
  });

  // Software-rendered WebGL starves the page, so the loading screen must not share it (ADR 0068).
  it("stops drawing the 3D city once the lookup starts, leaving the still picture", async () => {
    const { enter } = setup(new Promise<Response>(() => {}));
    expect(await screen.findByTestId("world-canvas", {}, { timeout: 10_000 })).toBeInTheDocument();
    await enter();
    expect((await screen.findAllByText(/Looking up your ledger/)).length).toBeGreaterThan(0);
    expect(screen.queryByTestId("world-canvas")).not.toBeInTheDocument();
    expect(screen.getByTestId("world-still")).toBeInTheDocument();
  }, 20_000);

  it("shows the 3D city as scenery, without a story, straight away", async () => {
    render(<WorldLayer started webgl reducedMotion={false} />);
    expect(await screen.findByTestId("world-canvas")).toHaveAttribute("data-scenery", "true");
  });
});
