---
type: Decision Record
title: "0053: M2 copy rules and data-presentation choices"
description: "Claude drafts the copy in one module with one fixed headline per slide; heroes, death heatmap, unspent souls, rank and MVP each have a fixed M2 presentation."
tags: [m2, copy, data]
status: stable
decision: accepted
decided_on: 2026-10-07
generated: { by: claude-code/claude-sonnet-5-5, at: 2026-10-08T15:00:00Z }
---

# Decision

The owner confirmed this on 2026-10-07. Applies [ADR 0007](0007-tone-hype-with-roasts.md), [ADR 0015](0015-v1-slides.md) and [ADR 0021](0021-kill-slides-and-mvp.md).

## Copy

- Claude drafts all copy, in a single `copy` module.
- One fixed headline per slide. Data-driven variants only for the roast slide and the MVP slide.
- Playful PG-13, no swearing in v1.

## Data presentation

| Item | M2 choice |
|---|---|
| Hero names | Static `heroId` to name map. No Valve art until the [asset terms](../open-questions/m2-hero-art-terms.md) are checked. |
| Death heatmap | Bin raw `[x, y]` death positions into a grid, draw an SVG density plot on an abstract deco frame (no map). The binning is pure and unit tested. Copy names the hottest cell ("You died here N times"). |
| Unspent souls | Verify the [unit](../open-questions/m2-unspent-souls-unit.md) first, then show it as a plain sentence. |
| Rank | Static tier-name map from research, fallback "Tier 4 · 2". Names need [confirmation](../open-questions/m2-rank-tier-names.md). |
| MVP | One generic template: label + `topPercent` + scope. "Not notable" means the best `topPercent` is above 50; then show the best global stat with neutral copy, no same-hero phrasing. A null `mvp` gets its own friendly copy. Per-metric one-liners are a backlog item. |

# As built

- Copy lives in the single `src/story/copy.ts`. Slide PRs briefly kept per-group copy files to avoid merge conflicts; PR 9 (#39) folded them in. Helpers for slides 8-10 still need consolidating (#37).
- Unspent souls ships as a neutral sentence with no unit claimed, until the [unit](../open-questions/m2-unspent-souls-unit.md) is confirmed (#36). The owner decided on 2026-10-08 that there is no number for now ([ADR 0055](0055-owner-confirmations-after-m2.md)).
- The rank tier map was built from the API fixture and was [confirmed by the owner](../open-questions/m2-rank-tier-names.md) on 2026-10-08 ([ADR 0055](0055-owner-confirmations-after-m2.md)).

> **Superseded in part ([ADR 0060](0060-owner-decisions-m2-open-questions.md)):** the unspent-souls rows (table and "As built") no longer apply; the stat was dropped on 2026-10-08. The hero-art row is also settled: art may be used, with a disclaimer.
