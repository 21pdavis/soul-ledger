import { fireEvent, render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { HeroTile } from "@/components/story/HeroTile";

describe("HeroTile", () => {
  it("shows the hero card art at the large size", () => {
    const { container } = render(<HeroTile heroId={1} size="lg" />);
    expect(container.querySelector("img")).toHaveAttribute("src", "/heroes/1-card.webp");
  });

  it("shows the small icon at the small size", () => {
    const { container } = render(<HeroTile heroId={1} />);
    expect(container.querySelector("img")).toHaveAttribute("src", "/heroes/1-sm.webp");
  });

  it("is decorative: the hero name always sits next to it as text", () => {
    const { container } = render(<HeroTile heroId={1} />);
    expect(container.querySelector("img")).toHaveAttribute("alt", "");
  });

  it("falls back to the monogram tile when the image fails to load", () => {
    const { container } = render(<HeroTile heroId={1} />);
    fireEvent.error(container.querySelector("img")!);
    expect(container.querySelector("img")).toBeNull();
    expect(container.textContent).toBe("IN");
  });

  it("tries the art again when it is shown for a different hero", () => {
    const { container, rerender } = render(<HeroTile heroId={1} />);
    fireEvent.error(container.querySelector("img")!);
    rerender(<HeroTile heroId={2} />);
    expect(container.querySelector("img")).toHaveAttribute("src", "/heroes/2-sm.webp");
  });
});
