import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DeathHeatmap } from "@/components/story/slides/DeathHeatmap";
import { binDeaths, hottestCell } from "@/story/death-bins";

function renderMap(points: [number, number][]) {
  const bins = binDeaths(points);
  const hot = hottestCell(bins)!;
  return render(<DeathHeatmap bins={bins} hot={hot} still />);
}

describe("death map", () => {
  it("draws a stylised Deadlock map under the heat: three lanes and two bases", () => {
    const { container } = renderMap([[0, 0]]);
    const map = container.querySelector("[data-map]");
    expect(map).not.toBeNull();
    expect(map!.querySelectorAll("path[data-lane]")).toHaveLength(3);
    expect(map!.querySelectorAll("[data-base]")).toHaveLength(2);
  });

  it("puts the map behind the heat so deaths stay visible", () => {
    const { container } = renderMap([[0, 0]]);
    const map = container.querySelector("[data-map]")!;
    const heat = container.querySelector("rect[data-count]")!;
    expect(map.compareDocumentPosition(heat) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("places a death by its world position: a death in the top lane is drawn above one in the bottom lane", () => {
    const { container } = renderMap([
      [0, 8000],
      [0, -8000],
    ]);
    const ys = [...container.querySelectorAll("rect[data-count]")].map((r) =>
      Number(r.getAttribute("y")),
    );
    expect(ys).toHaveLength(2);
    expect(Math.min(...ys)).toBeLessThan(60);
    expect(Math.max(...ys)).toBeGreaterThan(150);
  });
});
