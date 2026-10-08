import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { KillStat } from "@/components/story/KillStat";

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

const advance = (ms: number) => act(() => vi.advanceTimersByTime(ms));

describe("KillStat", () => {
  it("shows the final value at once when it should not animate", () => {
    render(<KillStat value={1500} animate={false} paused={false} />);
    expect(screen.getByText("1,500")).toBeInTheDocument();
  });

  it("counts up from 0 to the value, then holds there", () => {
    render(<KillStat value={1500} animate paused={false} />);
    expect(screen.getByText("0")).toBeInTheDocument();
    advance(250);
    const mid = Number(screen.getByTestId("kill-stat").textContent!.replace(/,/g, ""));
    expect(mid).toBeGreaterThan(0);
    expect(mid).toBeLessThan(1500);
    advance(1000);
    expect(screen.getByText("1,500")).toBeInTheDocument();
  });

  it("finishes inside the 800ms entrance window", () => {
    render(<KillStat value={1500} animate paused={false} delayMs={150} />);
    advance(800);
    expect(screen.getByText("1,500")).toBeInTheDocument();
  });

  it("jumps to the final value when animation is switched off mid-count", () => {
    const { rerender } = render(<KillStat value={1500} animate paused={false} />);
    advance(200);
    rerender(<KillStat value={1500} animate={false} paused={false} />);
    expect(screen.getByText("1,500")).toBeInTheDocument();
  });

  it("holds while paused and carries on when released", () => {
    const { rerender } = render(<KillStat value={1500} animate paused={false} />);
    advance(200);
    rerender(<KillStat value={1500} animate paused />);
    const held = screen.getByTestId("kill-stat").textContent;
    advance(2000);
    expect(screen.getByTestId("kill-stat").textContent).toBe(held);
    rerender(<KillStat value={1500} animate paused={false} />);
    advance(1000);
    expect(screen.getByText("1,500")).toBeInTheDocument();
  });

  it("renders 0 as 0 and uses a custom format", () => {
    render(<KillStat value={0} animate={false} paused={false} />);
    expect(screen.getByText("0")).toBeInTheDocument();
    render(<KillStat value={46} animate={false} paused={false} format={(n) => `${n}%`} />);
    expect(screen.getByText("46%")).toBeInTheDocument();
  });
});
