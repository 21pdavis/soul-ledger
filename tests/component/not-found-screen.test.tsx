import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import RootNotFound from "@/app/not-found";
import ShareNotFound from "@/app/w/[slug]/not-found";

describe("root not-found page (any unknown address)", () => {
  it("is generic and offers a way back to the start", () => {
    render(<RootNotFound />);
    expect(screen.getByRole("heading", { name: "Page not found" })).toBeInTheDocument();
    expect(screen.queryByText(/story/i)).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Go to Soul Ledger" })).toHaveAttribute("href", "/");
  });

  it("shows the non-affiliation notice like the other screens", () => {
    render(<RootNotFound />);
    expect(screen.getByText(/not affiliated/i)).toBeInTheDocument();
  });
});

describe("share-link not-found page", () => {
  it("says the story was not found and offers a way back to the entry screen", () => {
    render(<ShareNotFound />);
    expect(
      screen.getByRole("heading", { name: "We couldn't find that story" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/mistyped or removed/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Look up your own" })).toHaveAttribute("href", "/");
  });
});
