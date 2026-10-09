import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SlideFrame } from "@/components/story/SlideFrame";

describe("SlideFrame", () => {
  it("renders the headline as a heading with the slide content as real DOM text", () => {
    render(
      <SlideFrame headline="Welcome to the Cursed Apple">
        <p>120 matches</p>
      </SlideFrame>,
    );
    expect(
      screen.getByRole("heading", { name: "Welcome to the Cursed Apple" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Welcome to the Cursed Apple" })).toBeInTheDocument();
    expect(screen.getByText("120 matches")).toBeInTheDocument();
  });
});
