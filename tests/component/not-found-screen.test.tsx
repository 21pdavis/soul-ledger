import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { NotFoundScreen } from "@/components/app/NotFoundScreen";

describe("NotFoundScreen", () => {
  it("says the story was not found and offers a way back to the entry screen", () => {
    render(<NotFoundScreen />);
    expect(
      screen.getByRole("heading", { name: "We couldn't find that story" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/mistyped or removed/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Look up your own" })).toHaveAttribute("href", "/");
  });

  it("shows the non-affiliation notice like the other screens", () => {
    render(<NotFoundScreen />);
    expect(screen.getByText(/not affiliated/i)).toBeInTheDocument();
  });
});
