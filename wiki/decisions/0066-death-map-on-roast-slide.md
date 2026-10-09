---
type: Decision Record
title: "0066: The roast slide's death heatmap is drawn on a stylised Deadlock map"
description: "The death heatmap sits on a stylised map of the lanes and objectives (decorative, with the plot's title and description as the text alternative) on a finer 20 by 20 grid, replacing the abstract frame."
tags: [m2, story, heatmap, design]
status: stable
decision: accepted
decided_on: 2026-10-09
supersedes_parts_of: [0053]
generated: { by: claude-code/claude-sonnet-5-5, at: 2026-10-09T09:00:00Z }
---

# Decision

[ADR 0053](0053-m2-copy-and-data-presentation.md) drew the death heatmap on "an abstract deco frame (no map)". The owner iterated on it locally and preferred a map, and on 2026-10-09 asked for that version to be kept ("where'd the nice death heatmap go"). This supersedes the "no map" part of ADR 0053 only; the binning, the hottest-cell copy ("You died here N times") and the neutral tone stand.

| | Rule |
|---|---|
| Backdrop | `DeadlockMap` (`src/components/story/slides/DeadlockMap.tsx`): three lanes, objective diamonds and the two bases, drawn in the plot's 240-unit space. Stylised line art in our deco palette, not a copy of Valve's minimap. |
| Orientation | World x runs left to right and world y bottom to top, so the bases sit at the top and bottom. |
| Grid | `DEATH_GRID` is 20 (was 10) so the density follows the lanes. |
| Accessibility | The map is decorative (`aria-hidden`). The plot keeps its title and description, and the copy names the hottest cell as text ([ADR 0054](0054-m2-testing-and-accessibility.md)). |

# Also recorded

The owner's local edits changed "Cursed City" to "Cursed Apple" in [ADR 0015](0015-v1-slides.md) and [ADR 0031](0031-visual-identity.md) (the city's in-game name).
