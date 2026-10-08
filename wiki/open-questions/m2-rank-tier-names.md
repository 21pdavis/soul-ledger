---
type: Open Question
title: "Rank tier names for the rank journey slide"
description: "Whether the static tier-name map (badge tier 1 to 11 to names such as Oracle) matches the game, so the rank slide shows real names rather than the fallback."
tags: [m2, data, ranks]
status: draft
question_status: open
recommendation: "Build the map from /v1/assets/ranks, record it in a research page, and ask the owner to confirm the names. Until then, show the fallback 'Tier N · subrank'."
raised_on: 2026-10-07
generated: { by: claude-code/claude-sonnet-5-5, at: 2026-10-07T12:00:00Z }
---

# Context

A badge is `tier * 10 + subrank` (81 is Oracle 1, from the [test account](../research/test-account.md)). [ADR 0053](../decisions/0053-m2-copy-and-data-presentation.md) uses a static tier-name map taken from research, with the fallback "Tier 4 · 2" for unknown tiers. The full name list is not yet in the wiki, and the owner has not confirmed it.
