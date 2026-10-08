import { act, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { StaggerIn } from "@/components/story/slides/StaggerIn";
import { TallyNumber } from "@/components/story/slides/TallyNumber";

const base = { skipAnimation: false, reducedMotion: false, paused: false };

describe("TallyNumber", () => {
  it("shows the final value at once under reduced motion", () => {
    render(<TallyNumber value={1100} {...base} reducedMotion />);
    expect(screen.getByText("1,100")).toBeInTheDocument();
  });

  it("shows the final value at once when the player asks to skip", () => {
    render(<TallyNumber value={1100} {...base} skipAnimation />);
    expect(screen.getByText("1,100")).toBeInTheDocument();
  });

  it("counts up from zero and lands on the final value", async () => {
    render(<TallyNumber value={1100} {...base} />);
    expect(screen.queryByText("1,100")).not.toBeInTheDocument();
    expect(await screen.findByText("1,100", {}, { timeout: 1500 })).toBeInTheDocument();
  });

  it("jumps to the final value when skip arrives mid-count", async () => {
    const { rerender } = render(<TallyNumber value={1100} {...base} />);
    expect(screen.queryByText("1,100")).not.toBeInTheDocument();
    rerender(<TallyNumber value={1100} {...base} skipAnimation />);
    await waitFor(() => expect(screen.getByText("1,100")).toBeInTheDocument(), { timeout: 100 });
  });

  it("holds while paused and finishes once released", async () => {
    const { rerender } = render(<TallyNumber value={500} {...base} paused />);
    await act(async () => {
      await new Promise((r) => setTimeout(r, 900));
    });
    expect(screen.queryByText("500")).not.toBeInTheDocument();
    rerender(<TallyNumber value={500} {...base} />);
    expect(await screen.findByText("500", {}, { timeout: 1500 })).toBeInTheDocument();
  });

  it("renders a zero as 0, not blank", () => {
    render(<TallyNumber value={0} {...base} reducedMotion />);
    expect(screen.getByText("0")).toBeInTheDocument();
  });
});

describe("StaggerIn", () => {
  it("keeps its text in the DOM and visible at once under reduced motion", () => {
    render(
      <StaggerIn {...base} reducedMotion>
        <p>hello</p>
      </StaggerIn>,
    );
    expect(screen.getByText("hello").parentElement).toHaveStyle({ opacity: "1" });
  });

  it("starts hidden but in the DOM, then appears", async () => {
    render(
      <StaggerIn {...base} index={1}>
        <p>hello</p>
      </StaggerIn>,
    );
    expect(screen.getByText("hello")).toBeInTheDocument();
    expect(screen.getByText("hello").parentElement).toHaveStyle({ opacity: "0" });
    await waitFor(
      () => expect(screen.getByText("hello").parentElement).toHaveStyle({ opacity: "1" }),
      {
        timeout: 1500,
      },
    );
  });

  it("appears at once when skip arrives mid-entrance", async () => {
    const { rerender } = render(
      <StaggerIn {...base} index={3}>
        <p>hello</p>
      </StaggerIn>,
    );
    rerender(
      <StaggerIn {...base} index={3} skipAnimation>
        <p>hello</p>
      </StaggerIn>,
    );
    await waitFor(
      () => expect(screen.getByText("hello").parentElement).toHaveStyle({ opacity: "1" }),
      {
        timeout: 100,
      },
    );
  });
});
