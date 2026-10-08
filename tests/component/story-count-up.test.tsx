import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { StoryCountUp } from "@/components/story/StoryCountUp";
import { formatHours } from "@/story/format";

const still = { reducedMotion: false, skipAnimation: false, paused: false };

describe("StoryCountUp", () => {
  it("shows the final value at once under reduced motion", () => {
    render(<StoryCountUp value={1234} {...still} reducedMotion />);
    expect(screen.getByText("1,234")).toBeInTheDocument();
  });

  it("shows the final value at once when the player asks to skip", () => {
    render(<StoryCountUp value={1234} {...still} skipAnimation />);
    expect(screen.getByText("1,234")).toBeInTheDocument();
  });

  it("counts up from 0 and lands exactly on the final value", async () => {
    render(<StoryCountUp value={77} {...still} />);
    expect(screen.getByText("0")).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText("77")).toBeInTheDocument(), { timeout: 2000 });
  });

  it("jumps to the final value when skip arrives mid-count", async () => {
    const { rerender } = render(<StoryCountUp value={77} {...still} />);
    expect(screen.getByText("0")).toBeInTheDocument();
    rerender(<StoryCountUp value={77} {...still} skipAnimation />);
    await waitFor(() => expect(screen.getByText("77")).toBeInTheDocument());
  });

  it("renders a zero value as 0", () => {
    render(<StoryCountUp value={0} {...still} reducedMotion />);
    expect(screen.getByText("0")).toBeInTheDocument();
  });

  it("uses the given formatter for the final value", () => {
    render(<StoryCountUp value={0.2} format={formatHours} {...still} reducedMotion />);
    expect(screen.getByText("0.2")).toBeInTheDocument();
  });

  it("holds while paused", async () => {
    render(<StoryCountUp value={77} {...still} paused />);
    await new Promise((r) => setTimeout(r, 300));
    expect(screen.getByText("0")).toBeInTheDocument();
  });

  it("still shows the final value when reduced motion turns off after mount", () => {
    const { rerender } = render(<StoryCountUp value={77} {...still} reducedMotion />);
    rerender(<StoryCountUp value={77} {...still} reducedMotion={false} />);
    expect(screen.getByText("77")).toBeInTheDocument();
  });

  it("keeps the final value, not a partial one, if skip ends while motion stays on", async () => {
    const { rerender } = render(<StoryCountUp value={77} {...still} />);
    rerender(<StoryCountUp value={77} {...still} skipAnimation />);
    rerender(<StoryCountUp value={77} {...still} />);
    await waitFor(() => expect(screen.getByText("77")).toBeInTheDocument());
    await new Promise((r) => setTimeout(r, 200));
    expect(screen.getByText("77")).toBeInTheDocument();
  });

  it("lands on the final value after a pause and a resume", async () => {
    const { rerender } = render(<StoryCountUp value={77} {...still} paused />);
    await new Promise((r) => setTimeout(r, 150));
    expect(screen.getByText("0")).toBeInTheDocument();
    rerender(<StoryCountUp value={77} {...still} />);
    await waitFor(() => expect(screen.getByText("77")).toBeInTheDocument(), { timeout: 2000 });
  });

  it("waits delayMs before it starts counting, then lands on the final value", async () => {
    render(<StoryCountUp value={77} {...still} delayMs={400} durationMs={200} />);
    await new Promise((r) => setTimeout(r, 250));
    expect(screen.getByText("0")).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText("77")).toBeInTheDocument(), { timeout: 2000 });
  });

  it("ignores delayMs when skipped or reduced", () => {
    const { unmount } = render(<StoryCountUp value={77} {...still} delayMs={400} skipAnimation />);
    expect(screen.getByText("77")).toBeInTheDocument();
    unmount();
    render(<StoryCountUp value={77} {...still} delayMs={400} reducedMotion />);
    expect(screen.getByText("77")).toBeInTheDocument();
  });
});
