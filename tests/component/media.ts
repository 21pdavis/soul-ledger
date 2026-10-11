import { vi } from "vitest";

/**
 * jsdom has no matchMedia. Install one that answers from a small table: a query matches when its
 * key is listed. Pass `{ scroll: true }` for the desktop controller, `{ reduced: true }` for
 * prefers-reduced-motion.
 */
export function mockMedia({ scroll = false, reduced = false } = {}) {
  const answer = (query: string) => {
    if (query.includes("prefers-reduced-motion")) return reduced;
    if (query.includes("min-width") && query.includes("pointer: fine")) return scroll;
    return false;
  };
  window.matchMedia = vi.fn((query: string) => ({
    matches: answer(query),
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
}

export function clearMedia() {
  // @ts-expect-error test cleanup: jsdom normally has no matchMedia
  delete window.matchMedia;
}
