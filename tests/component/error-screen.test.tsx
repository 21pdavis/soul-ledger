import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ErrorScreen, type ErrorKind } from "@/components/app/ErrorScreen";

function setup(
  kind: ErrorKind,
  extra: { window?: "all" | "patch"; excludedMatches?: number } = {},
) {
  const onRetry = vi.fn();
  const onNewLookup = vi.fn();
  render(
    <ErrorScreen
      kind={kind}
      window={extra.window ?? "all"}
      excludedMatches={extra.excludedMatches}
      onRetry={onRetry}
      onNewLookup={onNewLookup}
    />,
  );
  return { onRetry, onNewLookup, user: userEvent.setup() };
}

describe("ErrorScreen", () => {
  it("not_found: says the profile was not found and to check that it is public", async () => {
    const { onNewLookup, user } = setup("not_found");
    expect(
      screen.getByRole("heading", { name: "We couldn't find that profile" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/public/i)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Try another profile" }));
    expect(onNewLookup).toHaveBeenCalled();
  });

  it.each(["unavailable", "fetch_failed"] as const)(
    "%s: says to try again in a minute and retry reruns the lookup",
    async (kind) => {
      const { onRetry, onNewLookup, user } = setup(kind);
      expect(screen.getByText(/try again in a minute/i)).toBeInTheDocument();
      await user.click(screen.getByRole("button", { name: "Try again" }));
      expect(onRetry).toHaveBeenCalledTimes(1);
      await user.click(screen.getByRole("button", { name: "Look up another player" }));
      expect(onNewLookup).toHaveBeenCalledTimes(1);
    },
  );

  it("invalid (the server rejected the input): asks for another link", async () => {
    const { onNewLookup, user } = setup("invalid");
    expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Try another link" }));
    expect(onNewLookup).toHaveBeenCalled();
    expect(screen.queryByRole("button", { name: "Try again" })).not.toBeInTheDocument();
  });

  it("no_matches: a friendly screen with no retry", async () => {
    const { onNewLookup, user } = setup("no_matches");
    expect(screen.getByRole("heading", { name: "No Deadlock matches found" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Try again" })).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Look up another player" }));
    expect(onNewLookup).toHaveBeenCalled();
    expect(screen.queryByText(/since the latest patch/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/street brawl/i)).not.toBeInTheDocument();
  });

  it("no_matches in the patch window mentions the latest patch", () => {
    setup("no_matches", { window: "patch" });
    expect(screen.getByText(/no matches since the latest patch/i)).toBeInTheDocument();
  });

  it("no_matches for a Street Brawl player explains why those games were skipped", () => {
    setup("no_matches", { excludedMatches: 14 });
    expect(screen.getByText(/14 games/)).toBeInTheDocument();
    expect(screen.getByText(/street brawl/i)).toBeInTheDocument();
  });

  it("moves focus to the title when it appears, so screen readers announce the error", () => {
    setup("not_found");
    const title = screen.getByRole("heading", { level: 1 });
    expect(title).toHaveAttribute("tabindex", "-1");
    expect(title).toHaveFocus();
  });

  it("never renders a bare error code", () => {
    for (const kind of ["not_found", "unavailable", "fetch_failed", "invalid"] as const) {
      const { container } = render(
        <ErrorScreen kind={kind} window="all" onRetry={() => {}} onNewLookup={() => {}} />,
      );
      expect(container).not.toHaveTextContent(kind);
    }
  });
});
