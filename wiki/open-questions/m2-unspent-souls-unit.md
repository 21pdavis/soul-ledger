---
type: Open Question
title: "Unit of avgUnspentGoldMinutes for the unspent-souls roast"
description: "What the Unspent Gold Minutes stat measures (souls times minutes or minutes), which decides how the roast slide can phrase it."
tags: [m2, data, copy]
status: draft
question_status: open
recommendation: "Check src/lib/stats/normalize.ts and the deadlock-api docs or source, and compare against known matches. Until verified, phrase the roast without a unit, as a plain sentence about hoarding souls."
raised_on: 2026-10-07
generated: { by: claude-code/claude-sonnet-5-5, at: 2026-10-07T12:00:00Z }
---

# Context

`Story.roast.avgUnspentGoldMinutes` is the mean per match of `custom_user_stats["Unspent Gold Minutes"]`. The [bulk metadata research](../research/bulk-match-metadata.md) found it averages about 84,800 per match, which looks like souls multiplied by minutes, not minutes. The unit is unverified.

[ADR 0053](../decisions/0053-m2-copy-and-data-presentation.md) says to verify the unit and show it as a plain sentence. The verification is part of the roast slide PR.
