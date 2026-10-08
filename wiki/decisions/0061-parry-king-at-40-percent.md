---
type: Decision Record
title: "0061: Parry king starts at a 40% success rate"
description: "The owner lowered the parry-king line from 60% to 40% of parries landed, because a player at 40% or higher is not a clown; this supersedes the parry line in ADR 0040."
tags: [m2, tuning, stats]
status: stable
decision: accepted
decided_on: 2026-10-08
generated: { by: claude-code/claude-sonnet-5-5, at: 2026-10-08T21:00:00Z }
---

# Decision

A player who lands **40% or more** of their parries is a **parry king**. Below 40% is a **clown**. With no parries landed the label stays "none". `PARRY_KING_RATE` in `src/lib/stats/story.ts` is `0.4`; the slide copy and meter mark read the same constant.

# Reasoning

The owner said a 40% or better parry rate is not clown behaviour, so the 60% line set in [ADR 0040](0040-m1-implementation-choices.md) was too harsh.

# Consequences

- **Supersedes in part** [ADR 0040](0040-m1-implementation-choices.md): only its "Parry label" row. The rest of 0040 stands.
- Naming note: "king" at 40% is a generous title (most parries missing still crowns you). The labels are kept as they are; a rename is a copy decision for the owner.
