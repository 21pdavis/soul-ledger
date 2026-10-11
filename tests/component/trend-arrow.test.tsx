import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TrendArrow } from "@/components/story/TrendArrow";
import { recentTrend } from "@/story/copy";

describe("TrendArrow", () => {
  it("draws the arrow with a spoken name", () => {
    const trend = recentTrend(0.5, { matches: 300, winRate: 0.6 })!;
    render(<TrendArrow trend={trend} />);
    expect(screen.getByRole("img", { name: "trending up" })).toHaveTextContent("▲");
  });

  it("draws nothing when the trend is flat", () => {
    const trend = recentTrend(0.5, { matches: 300, winRate: 0.5 })!;
    const { container } = render(<TrendArrow trend={trend} />);
    expect(container).toBeEmptyDOMElement();
  });
});
