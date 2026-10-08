---
type: Open Question
title: "Rank tier names for the rank journey slide"
description: "Whether the static tier-name map (badge tier 1 to 11 to names such as Oracle) matches the game, so the rank slide shows real names rather than the fallback."
tags: [m2, data, ranks]
status: stable
question_status: resolved
resolved_by: ../decisions/0060-owner-decisions-m2-open-questions.md
recommendation: "Resolved: the names in src/story/ranks.ts are accepted (ADR 0060, earlier ADR 0055). Unknown tiers still use the fallback."
raised_on: 2026-10-07
generated: { by: claude-code/claude-sonnet-5-5, at: 2026-10-08T20:00:00Z }
---

# Context

A badge is `tier * 10 + subrank` (81 is Oracle 1, from the [test account](../research/test-account.md)). [ADR 0053](../decisions/0053-m2-copy-and-data-presentation.md) uses a static tier-name map taken from research, with the fallback "Tier 4 · 2" for unknown tiers. The full name list is not yet in the wiki, and the owner has not confirmed it.

# Status

The foundation PR builds the static map in `src/story/ranks.ts` from the recorded `/v1/assets/ranks` fixture (tiers 0 to 11: Obscurus, Initiate, Seeker, Acolyte, Sentinel, Mystic, Ritualist, Emissary, Oracle, Phantom, Ascendant, Eternus). It matches the one known data point (badge 81 = Oracle 1). Unknown tiers still use the fallback. The owner confirmed on 2026-10-08 that the names match the game ([ADR 0055](../decisions/0055-owner-confirmations-after-m2.md)). Resolved.

Owner decision restated, 2026-10-08 ([ADR 0060](../decisions/0060-owner-decisions-m2-open-questions.md)).
