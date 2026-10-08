---
type: Decision Record
title: "0050: M2 story flow: phone tap-through and desktop pinned snap-scroll over one slide index"
description: "The story is a 9:16 tap-through on phones and a pinned 9:16 column with scroll-snap checkpoints on desktop, both driven by one shared slide index and the same slide components."
tags: [m2, story, layout, ux]
status: stable
decision: accepted
decided_on: 2026-10-07
generated: { by: claude-code/claude-sonnet-5-5, at: 2026-10-08T12:00:00Z }
---

# Decision

Refines [ADR 0012](0012-phone-first.md) and [ADR 0028](0028-milestones.md) for M2. The owner confirmed this on 2026-10-07.

**Same slide components, two controllers, one shared slide index.**

| | Phone controller | Desktop controller |
|---|---|---|
| When | Viewport under 1024px **or** coarse pointer | Width 1024px or more **and** fine pointer |
| Layout | Full-screen 9:16 | Pinned (sticky) centered 9:16 column, capped at about 480px wide and fitted to viewport height, over an ink deco-pattern background |
| Advance | Tap right side = next, left side = back | Scroll through 11 CSS scroll-snap checkpoints, one per slide |
| Also | Segmented progress bar at the top | Arrow keys, space and progress-bar clicks jump to a slide, and scroll position follows |

# Rules

- A tap during an animation **completes** it; the next tap advances.
- Press-and-hold pauses (phone).
- Back on slide 1 does nothing.
- **No auto-play in M2** (see the [backlog](../recommendations/backlog.md)).
- Desktop: each slide's animation plays **one-shot on arrival**, not scrubbed by scroll position.
- The last slide (summary, a static card in M2; PNG export is M4) offers **Replay** and **Look up another player**.
- M3's 3D scene later goes **behind the column**, which keeps the intent of ADR 0012 (a 3D backdrop on desktop).
- Full-width desktop slide layouts are a backlog item, not M2.

# As built

- Slides share one contract, `SlideComponentProps` (`src/components/story/slides/contract.ts`): the slide's data plus `active`, `skipAnimation`, `reducedMotion` and `paused`. The player owns the index and the entrance clock (a held press stops it).
- The stage mounts only after hydration (`useIsClient`), because the controller choice depends on viewport and pointer, which the server cannot know.
- Desktop is a scroll column with snap checkpoints. Taps navigate on the phone controller only, so a slide's own controls must be real `<button>`, `<a>`, `<input>` or `<select>` elements.
