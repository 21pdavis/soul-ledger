---
type: Decision Record
title: "0028: v1 milestones M1-M6; works on phone and desktop web; dashboard after v1"
description: v1 ships in six milestones from data layer to Hall of Fame and must work on both phone and desktop web.
tags: [planning]
status: stable
decision: accepted
decided_on: 2026-10-06
generated: { by: claude-code/claude-opus-5-5, at: 2026-10-06T16:00:00Z }
---

# Decision

| Milestone | Scope |
|---|---|
| M1 | Data layer: Steam URL to account id, fetch and cache matches, compute stats, global percentiles |
| M2 | The 11-slide story in 2D with placeholder art, **fully playable on phone and desktop web** |
| M3 | 3D world, then hero models for all playable heroes, in batches |
| M4 | Sharing: PNG cards, story snapshots, OG images |
| M5 | Squad mode |
| M6 | Hall of Fame and removal form |

- The dashboard/hub comes **after v1**.
- **Phone and desktop web are both first-class at every milestone.** The phone-first 9:16 layout ([ADR 0012](0012-phone-first.md)) must also feel deliberate on desktop.

> **Superseded in part ([ADR 0068](0068-m3-scope-and-order.md)):** M3 is now a story-following world with art cards for every hero first; low-poly models follow a three-hero checkpoint instead of covering all playable heroes up front.
