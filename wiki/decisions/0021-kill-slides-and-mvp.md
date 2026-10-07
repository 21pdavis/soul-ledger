---
type: Decision Record
title: "0021: Two kill slides; MVP is the most extreme percentile stat"
description: '"How you kill" and "Precision" are separate slides; the MVP signature stat is the player''s most extreme percentile, compared against same-hero players where possible.'
tags: [story]
status: stable
decision: accepted
decided_on: 2026-10-06
generated: { by: claude-code/claude-opus-5-5, at: 2026-10-06T14:00:00Z }
---

# Decision

- "How you kill" and "Precision" are **two separate slides** (slides 5 and 6 in [ADR 0015](0015-v1-slides.md)).
- The **MVP signature stat** is the stat where the player is most extreme by percentile. Where possible it compares against players of the same hero ("Top 0.5% of Paradox players in melee kills").
- Selection is weighted toward unusual stats, so it isn't always kills.
