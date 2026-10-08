---
type: Decision Record
title: "0054: M2 testing layers and accessibility rules"
description: "M2 adds component tests per slide, phone and desktop Playwright suites with a mocked NDJSON lookup, and an accessibility baseline checked by tests."
tags: [m2, testing, accessibility]
status: stable
decision: accepted
decided_on: 2026-10-07
generated: { by: claude-code/claude-sonnet-5-5, at: 2026-10-08T12:00:00Z }
---

# Decision

The owner confirmed this on 2026-10-07. Applies [ADR 0046](0046-strict-red-first-tdd.md) to M2.

## Testing

| Layer | Covers |
|---|---|
| Unit | Pure logic: heatmap binning, copy selection, slide-index logic for both controllers, hero-name and tier maps |
| Component | Each slide, rendered with a fixture `Story`. Add Vitest jsdom and React Testing Library in the foundation PR if missing. |
| Playwright | Phone (Pixel 7) and desktop (1440x900), with a mocked NDJSON lookup: enter URL, tap through 11 slides on phone, scroll checkpoints on desktop, error states, keyboard |
| Staging e2e | After merges |

## Accessibility

- Real DOM text (no text baked into canvas or images).
- An `aria-live` slide announcer.
- Keyboard operable, with visible focus rings.
- WCAG AA contrast checked in a unit test.
- One Playwright test drives the whole story by keyboard.

# As built

- `tests/e2e/a11y.spec.ts` runs a pinned `@axe-core/playwright` scan over the entry, loading, error and zero-matches screens and all 11 slides (full and sparse story) on phone and desktop. Any violation fails and no rule is disabled.
- A keyboard-only Playwright test completes the whole story, Reduced motion is covered by component tests (per-slide `reducedMotion: true` cases and the loading screen), not by an e2e suite; the only e2e use of reduced motion is in `summary.spec.ts`, to speed up the layout matrix. An e2e check is on the [backlog](../recommendations/backlog.md).
- Playwright ports are overridable (`PLAYWRIGHT_PORT`, `PLAYWRIGHT_GATE_PORT`) so several worktrees can run e2e at once.
