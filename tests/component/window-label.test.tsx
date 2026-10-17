import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { StaleNote } from "@/components/app/StaleNote";
import { WindowLabel } from "@/components/story/WindowLabel";

describe("WindowLabel", () => {
  it("says All time for the default window", () => {
    render(<WindowLabel meta={{ window: "all", patchStart: null, stale: false }} />);
    expect(screen.getByText("All time")).toBeInTheDocument();
  });

  it("says which patch the story starts at, from the server's date", () => {
    render(
      <WindowLabel
        meta={{ window: "patch", patchStart: "2026-09-30T00:00:00.000Z", stale: false }}
      />,
    );
    expect(screen.getByText("Since patch Sep 30, 2026")).toBeInTheDocument();
  });

  it("shows All time with a short note when the patch date was unavailable (#25)", () => {
    const { container } = render(
      <WindowLabel
        meta={{ window: "all", patchStart: null, patchUnavailable: true, stale: false }}
      />,
    );
    expect(container).toHaveTextContent("All time (couldn't find the patch date)");
  });

  it("never says 'This patch' when the server had no patch date (#25)", () => {
    const { container } = render(
      <WindowLabel meta={{ window: "patch", patchStart: null, stale: false }} />,
    );
    expect(container).toHaveTextContent(/^All time/);
    expect(container).not.toHaveTextContent(/this patch/i);
  });
});

describe("StaleNote", () => {
  it("tells the player the story comes from cached matches", () => {
    render(<StaleNote />);
    expect(screen.getByRole("status")).toHaveTextContent(/showing cached matches/i);
  });

  it("can be dismissed", async () => {
    render(<StaleNote />);
    await userEvent.click(screen.getByRole("button", { name: "Dismiss" }));
    expect(screen.queryByText(/showing cached matches/i)).not.toBeInTheDocument();
  });
});
