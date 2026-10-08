import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SLIDES, headlineFor } from "@/story/copy";
import { SLIDE_COMPONENTS } from "@/components/story/slides";
import { fixtureSlideProps } from "../fixtures/story";

describe("slide registry", () => {
  it("has exactly one component for each of the 11 slides", () => {
    expect(Object.keys(SLIDE_COMPONENTS).sort()).toEqual(SLIDES.map((s) => s.id).sort());
    expect(SLIDES).toHaveLength(11);
  });

  it.each(SLIDES.map((s) => s.id))("%s renders its headline from a fixture story", (id) => {
    const Slide = SLIDE_COMPONENTS[id];
    render(
      <Slide
        {...fixtureSlideProps()}
        active
        skipAnimation={false}
        reducedMotion={false}
        paused={false}
      />,
    );
    expect(screen.getByRole("heading", { name: headlineFor(id) })).toBeInTheDocument();
  });
});
