import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { WorldLayer } from "@/components/world/WorldLayer";
import { GRAPHICS_KEY } from "@/lib/client/graphics";
import { fixtureStory } from "../fixtures/story";

// The real canvas needs WebGL, which jsdom lacks; a stand-in shows where it would mount.
const canvasThrows = vi.hoisted(() => ({ on: false }));
vi.mock("@/components/world/WorldCanvas", () => ({
  default: ({ slide, level, onSlow }: { slide: number; level: string; onSlow?: () => void }) => {
    if (canvasThrows.on) throw new Error("WebGL context lost");
    return (
      <div data-testid="world-canvas" data-slide={slide} data-level={level}>
        {/* Stands in for the frame-rate monitor deciding the city is too slow. */}
        {onSlow && <button data-testid="fake-slow" tabIndex={-1} onClick={onSlow} />}
      </div>
    );
  },
}));

/**
 * The world behind the story (ADR 0068): 3D only once the story has started and only when the
 * graphics level allows it; otherwise (Off, or no WebGL) a still picture of the city.
 */
describe("WorldLayer", () => {
  beforeEach(() => {
    // jsdom reports this machine's cores; pin a strong device so the start level is predictable.
    vi.spyOn(navigator, "hardwareConcurrency", "get").mockReturnValue(8);
  });
  afterEach(() => {
    localStorage.clear();
    canvasThrows.on = false;
    vi.restoreAllMocks();
  });

  it("falls back to the still picture if the 3D fails, instead of breaking the page", async () => {
    canvasThrows.on = true;
    vi.spyOn(console, "error").mockImplementation(() => {});
    render(<WorldLayer story={fixtureStory()} slide={0} started webgl reducedMotion={false} />);
    expect(await screen.findByTestId("world-still")).toBeInTheDocument();
    expect(screen.queryByTestId("world-canvas")).not.toBeInTheDocument();
  });

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

describe("WorldLayer graphics button", () => {
  beforeEach(() => {
    vi.spyOn(navigator, "hardwareConcurrency", "get").mockReturnValue(8);
  });
  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  const ui = (slide = 0) => (
    <WorldLayer story={fixtureStory()} slide={slide} started webgl reducedMotion={false} />
  );

  it("cycles Full, Simple, Off, Full live, and remembers each choice on this device", async () => {
    const user = userEvent.setup();
    render(ui(3));
    const button = screen.getByRole("button", { name: /graphics: full/i });
    expect(button).toHaveTextContent("Full");
    expect(await screen.findByTestId("world-canvas")).toHaveAttribute("data-level", "full");

    await user.click(button);
    expect(screen.getByRole("button", { name: /graphics: simple/i })).toHaveTextContent("Simple");
    expect(localStorage.getItem(GRAPHICS_KEY)).toBe("simple");
    expect(screen.getByTestId("world")).toHaveAttribute("data-level", "simple");
    const canvas = await screen.findByTestId("world-canvas");
    expect(canvas).toHaveAttribute("data-level", "simple");
    // The story's place is untouched by the switch.
    expect(canvas).toHaveAttribute("data-slide", "3");

    await user.click(screen.getByRole("button", { name: /graphics: simple/i }));
    expect(localStorage.getItem(GRAPHICS_KEY)).toBe("off");
    expect(screen.getByTestId("world-still")).toBeInTheDocument();
    expect(screen.queryByTestId("world-canvas")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /graphics: off/i }));
    expect(localStorage.getItem(GRAPHICS_KEY)).toBe("full");
    expect(await screen.findByTestId("world-canvas")).toBeInTheDocument();
  });

  it("works from the keyboard", async () => {
    const user = userEvent.setup();
    render(ui());
    await user.tab();
    expect(screen.getByRole("button", { name: /graphics: full/i })).toHaveFocus();
    await user.keyboard("{Enter}");
    expect(screen.getByTestId("world")).toHaveAttribute("data-level", "simple");
  });

  it("starts on a saved level, and on Simple for a weak device", () => {
    localStorage.setItem(GRAPHICS_KEY, "off");
    const { unmount } = render(ui());
    expect(screen.getByTestId("world")).toHaveAttribute("data-level", "off");
    unmount();
    localStorage.clear();
    vi.spyOn(navigator, "hardwareConcurrency", "get").mockReturnValue(2);
    render(ui());
    expect(screen.getByTestId("world")).toHaveAttribute("data-level", "simple");
  });

  it("has no button where there is no WebGL to switch", () => {
    render(<WorldLayer story={fixtureStory()} slide={0} started webgl={false} />);
    expect(screen.queryByRole("button", { name: /graphics/i })).not.toBeInTheDocument();
  });
});

describe("WorldLayer auto-drop", () => {
  beforeEach(() => {
    vi.spyOn(navigator, "hardwareConcurrency", "get").mockReturnValue(8);
  });
  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  const ui = () => (
    <WorldLayer story={fixtureStory()} slide={0} started webgl reducedMotion={false} />
  );

  it("drops one level when the city is too slow, says so politely, and remembers it", async () => {
    const user = userEvent.setup();
    render(ui());
    // The polite announcement area exists before any message, so screen readers pick it up.
    const status = screen.getByRole("status");
    expect(status).toHaveAttribute("aria-live", "polite");
    expect(status).toBeEmptyDOMElement();

    await user.click(await screen.findByTestId("fake-slow"));
    expect(screen.getByTestId("world")).toHaveAttribute("data-level", "simple");
    expect(screen.getByRole("status")).toHaveTextContent("Graphics lowered to keep things smooth");
    expect(screen.getByRole("button", { name: /graphics: simple/i })).toBeInTheDocument();
    expect(localStorage.getItem(GRAPHICS_KEY)).toBe("simple");
    // It never raises by itself: Simple is still Simple, and a second slow report goes to Off.
    await user.click(await screen.findByTestId("fake-slow"));
    expect(screen.getByTestId("world")).toHaveAttribute("data-level", "off");
  });

  it("the note fades away after a few seconds", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    try {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      render(ui());
      await user.click(await screen.findByTestId("fake-slow"));
      expect(screen.getByRole("status")).toHaveTextContent(/lowered/i);
      await act(async () => {
        vi.advanceTimersByTime(6000);
      });
      expect(screen.getByRole("status")).toBeEmptyDOMElement();
    } finally {
      vi.useRealTimers();
    }
  });

  it("stops watching once the reader picks a level by hand", async () => {
    const user = userEvent.setup();
    render(ui());
    await user.click(screen.getByRole("button", { name: /graphics: full/i }));
    expect(screen.getByTestId("world")).toHaveAttribute("data-level", "simple");
    await user.click(screen.getByRole("button", { name: /graphics: simple/i }));
    await user.click(screen.getByRole("button", { name: /graphics: off/i }));
    await user.click(screen.getByRole("button", { name: /graphics: full/i }));
    expect(await screen.findByTestId("world-canvas")).toHaveAttribute("data-level", "simple");
    // No monitor is wired in once a manual choice has been made this visit.
    expect(screen.queryByTestId("fake-slow")).not.toBeInTheDocument();
    expect(screen.getByRole("status")).toBeEmptyDOMElement();
  });
});

describe("WorldLayer on a server-rendered page", () => {
  it("renders the same thing on the server and on first browser render (no hydration mismatch)", async () => {
    const { renderToString } = await import("react-dom/server");
    const { hydrateRoot } = await import("react-dom/client");
    const { act } = await import("react");
    const ui = (
      <WorldLayer story={fixtureStory()} slide={0} started={false} reducedMotion={false} />
    );
    // The server has no WebGL to probe; the browser here does (webgl defaults to the probe).
    const realDocument = globalThis.document;
    const html = (() => {
      // @ts-expect-error simulate the server: no document to create a probe canvas on
      delete globalThis.document;
      try {
        return renderToString(ui);
      } finally {
        globalThis.document = realDocument;
      }
    })();
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({
      getExtension: () => null,
    } as unknown as RenderingContext);
    const container = document.createElement("div");
    container.innerHTML = html;
    document.body.appendChild(container);
    try {
      const recoverable = vi.fn();
      await act(async () => {
        hydrateRoot(container, ui, { onRecoverableError: recoverable });
      });
      expect(recoverable).not.toHaveBeenCalled();
    } finally {
      container.remove();
    }
  });
});
