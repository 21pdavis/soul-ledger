---
type: Decision Record
title: "0062: Desktop story is a vertical stack of wide cards"
description: "On desktop the story is a vertical page of wide cards, one per slide, that scrolls down card by card with a vertical progress rail, replacing the pinned 9:16 column; phone is unchanged."
tags: [m2, story, layout, desktop, ux]
status: stable
decision: accepted
decided_on: 2026-10-08
generated: { by: claude-code/claude-sonnet-5-5, at: 2026-10-08T18:00:00Z }
---

> **Partly superseded** by [ADR 0069](0069-m3-city-tour-and-hero-cards.md) (2026-10-11); see its "Supersedes in part" section.

# Decision

Refines [ADR 0050](0050-m2-story-flow-and-controllers.md) (desktop controller only) after owner feedback that the pinned column just faked the phone's tap navigation. The phone controller, the shared slide index and the slide contract are unchanged ([ADR 0012](0012-phone-first.md) stays phone-first).

| | Desktop (1024px or more, fine pointer) |
|---|---|
| Layout | A vertical page of 11 wide cards (up to 64rem), one per slide, stacked down the page |
| Advance | Scrolling down moves to the next card and the page visibly moves; scroll-snap checkpoints (one viewport high each) keep one card in view |
| Spacing | Breathing room above and below each card, wide side gutters (progress rail on the right, left free). Nothing sits behind the gutters, so M3's 3D hero models can go there |
| Progress | A vertical segmented rail in the right gutter; same states, buttons and focus ring as the phone bar |
| Keys | Arrow keys and space jump a card and the scroll follows (unchanged) |

# Rules

- A card shows its slide only once the reader has reached it, so the one-shot entrance plays on arrival, not while offscreen ([ADR 0050](0050-m2-story-flow-and-controllers.md)). Until then it is an empty frame with the headline, hidden from assistive tech. Cards the reader has passed stay mounted and show their finished state; revisiting one replays its entrance, as on the phone. Cards other than the current one are `inert`, so they leave the tab order and the accessibility tree.
- Slides still never navigate themselves and still size to their frame with container queries; wide-card layouts use `@container (min-width: 720px)` (the Scavenger slide goes from three stacked rows to three staggered columns). Other slides use the room as it comes; more multi-column layouts are backlog.
- Reduced motion: scrolling jumps instantly, and the current-card dimming transition is off ([ADR 0054](0054-m2-testing-and-accessibility.md)). The live region still announces slide changes.
