import { fireEvent, render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MonogramTile } from "@/components/story/MonogramTile";
import { heroImageUrl } from "@/story/hero-images";

describe("hero art on tiles (ADR 0064)", () => {
  it("maps a known hero id to a deadlock-api image and an unknown one to null", () => {
    expect(heroImageUrl(1)).toBe(
      "https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/inferno_sm.webp",
    );
    expect(heroImageUrl(99999)).toBeNull();
  });

  it("shows the hero image as decorative art (the name sits beside it) over the monogram", () => {
    const { container } = render(<MonogramTile heroId={1} />);
    const img = container.querySelector("img");
    expect(img).not.toBeNull();
    expect(img?.getAttribute("src")).toBe(heroImageUrl(1));
    expect(img?.getAttribute("alt")).toBe("");
    expect(container.textContent).toContain("IN");
  });

  it("drops the image and keeps the monogram when the image fails", () => {
    const { container } = render(<MonogramTile heroId={1} />);
    fireEvent.error(container.querySelector("img")!);
    expect(container.querySelector("img")).toBeNull();
    expect(container.textContent).toContain("IN");
  });

  it("uses only the monogram for a hero with no image", () => {
    const { container } = render(<MonogramTile heroId={99999} />);
    expect(container.querySelector("img")).toBeNull();
    expect(container.textContent).toBe("?");
  });
});
