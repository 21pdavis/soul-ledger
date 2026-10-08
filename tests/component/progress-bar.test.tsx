import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ProgressBar } from "@/components/story/ProgressBar";

describe("ProgressBar", () => {
  it("shows one segment per slide with the current one marked", () => {
    render(<ProgressBar count={11} current={3} />);
    const items = screen.getAllByRole("listitem");
    expect(items).toHaveLength(11);
    expect(items.slice(0, 3).every((i) => i.dataset.state === "done")).toBe(true);
    expect(items[3]).toHaveAttribute("aria-current", "step");
    expect(items[3].dataset.state).toBe("current");
    expect(items[4].dataset.state).toBe("todo");
  });

  it("jumps to a slide when a segment is chosen", async () => {
    const onSelect = vi.fn();
    render(<ProgressBar count={11} current={0} onSelect={onSelect} />);
    await userEvent.click(screen.getByRole("button", { name: "Go to slide 6" }));
    expect(onSelect).toHaveBeenCalledWith(5);
  });
});
