import { render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { FALLBACK_CARD_SRC } from "@/story/hero-art";

const loaded: string[] = [];
vi.mock("@react-three/drei", () => ({
  Line: () => null,
  useTexture: (src: string) => {
    if (src === "/heroes/1-card.webp") throw new Error("texture failed to load");
    loaded.push(src);
    return { image: { width: 100, height: 160 } };
  },
}));
vi.mock("@react-three/fiber", () => ({ useFrame: () => {} }));

import { Standee } from "@/components/world/city/Props";

const member = (heroId: number) => ({
  heroId,
  pos: [0, 0, 0] as [number, number, number],
  facing: 0,
});

describe("Standee", () => {
  beforeEach(() => {
    loaded.length = 0;
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("falls back to the silhouette for a standee whose card fails to load, without throwing", () => {
    expect(() => render(<Standee member={member(1)} />)).not.toThrow();
    expect(loaded).toContain(FALLBACK_CARD_SRC);
  });

  it("leaves other standees on their own cards", () => {
    render(
      <>
        <Standee member={member(1)} />
        <Standee member={member(2)} />
      </>,
    );
    expect(loaded).toContain("/heroes/2-card.webp");
    expect(loaded).not.toContain("/heroes/1-card.webp");
  });
});
