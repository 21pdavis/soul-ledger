import { renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { SCROLL_MODE_QUERY, useStoryMode } from "@/components/story/useStoryMode";
import { clearMedia, mockMedia } from "./media";

afterEach(clearMedia);

describe("useStoryMode", () => {
  it("defaults to tap when matchMedia is unavailable (SSR, old browsers)", () => {
    const { result } = renderHook(() => useStoryMode());
    expect(result.current).toBe("tap");
  });

  it("is tap when the viewport is narrow or the pointer is coarse", () => {
    mockMedia({ scroll: false });
    const { result } = renderHook(() => useStoryMode());
    expect(result.current).toBe("tap");
  });

  it("is scroll for 1024px and wider with a fine pointer", () => {
    mockMedia({ scroll: true });
    const { result } = renderHook(() => useStoryMode());
    expect(result.current).toBe("scroll");
  });

  it("uses the ADR 0050 breakpoint", () => {
    expect(SCROLL_MODE_QUERY).toBe("(min-width: 1024px) and (pointer: fine)");
  });
});
