import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
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

  it("never says 'This patch' when the server had no patch date (#25)", () => {
    const { container } = render(
      <WindowLabel meta={{ window: "patch", patchStart: null, stale: false }} />,
    );
    expect(container).toHaveTextContent(/^All time/);
    expect(container).not.toHaveTextContent(/this patch/i);
  });
});

describe("StaleNote", () => {
  it("mounts an empty live region, then fills it with the cached-matches text", async () => {
    render(<StaleNote onDismiss={() => {}} />);
    expect(screen.getByRole("status")).toBeEmptyDOMElement();
    await waitFor(() =>
      expect(screen.getByRole("status")).toHaveTextContent(/showing cached matches/i),
    );
  });

  it("asks to be dismissed when the button is pressed", async () => {
    const onDismiss = vi.fn();
    render(<StaleNote onDismiss={onDismiss} />);
    await userEvent.click(await screen.findByRole("button", { name: "Dismiss" }));
    expect(onDismiss).toHaveBeenCalledOnce();
  });
});
