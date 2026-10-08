---
type: Decision Record
title: "0040: M1 implementation choices confirmed; parry king at 60%"
description: Confirms M1's libraries, flattened stat schema and tuning values as built, and sets the parry-king line at a 60% success rate.
tags: [m1, tooling, backend, tuning]
status: stable
decision: accepted
decided_on: 2026-10-07
generated: { by: claude-code/claude-opus-5-5, at: 2026-10-07T04:45:00Z }
---

# Decision

The user confirmed the choices listed in the [M1 implementation choices](../open-questions/m1-implementation-choices.md) question, with one change.

| Area | Decision |
|---|---|
| Integration tests | **PGlite** (in-process Postgres) |
| Driver | **node-postgres (`pg`)** to Neon's pooler |
| API responses | Validated with **zod** |
| Styling | **No Tailwind** for now; revisit for M2 if wanted |
| `/api/lookup` | **NDJSON stream** of progress events, then the story |
| Schema | `player_matches` keeps **flattened stat columns**, not raw API JSON |
| Parry label | **King at a 60% or higher success rate**, otherwise clown; "none" with no parries landed. *Changed from 50%.* |
| Same-hero percentiles | Need 10 or more main-hero matches |
| Resync | A lookup reuses the cache if the player synced in the last 5 minutes |
| MVP weights | kills 0.8; deaths, assists 0.9; accuracy, objective damage 1.1; denies, teammate healing, headshot rate 1.2; others 1.0 |

The Tailwind question was settled for M2 by [ADR 0051](0051-m2-visual-motion-styling-stack.md): still no Tailwind.

The tuning values (resync window, sample size, MVP weights) are "keep for now". Revisit them once real stories are visible in M2.

Related: [ADR 0034](0034-tooling.md) (tooling), [ADR 0038](0038-one-trick-threshold-50.md) (one-trick line).
