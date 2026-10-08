---
type: Open Question
title: "Unit of avgUnspentGoldMinutes for the unspent-souls roast"
description: "What the Unspent Gold Minutes stat measures (souls times minutes or minutes), which decides how the roast slide can phrase it."
tags: [m2, data, copy]
status: draft
question_status: open
recommendation: "Check src/lib/stats/normalize.ts and the deadlock-api docs or source, and compare against known matches. Until verified, phrase the roast without a unit, as a plain sentence about hoarding souls."
raised_on: 2026-10-07
generated: { by: claude-code/claude-sonnet-5-5, at: 2026-10-08T12:00:00Z }
---

# Context

`Story.roast.avgUnspentGoldMinutes` is the mean per match of `custom_user_stats["Unspent Gold Minutes"]`. The [bulk metadata research](../research/bulk-match-metadata.md) found it averages about 84,800 per match, which looks like souls multiplied by minutes, not minutes. The unit is unverified.

[ADR 0053](../decisions/0053-m2-copy-and-data-presentation.md) says to verify the unit and show it as a plain sentence. The verification is part of the roast slide PR.

# Status

Checked on 2026-10-08 in the M2 roast slide PR. The unit is **inferred from the data and unconfirmed by Valve**, so the question stays open for the owner to accept.

The code path is `custom_user_stats["Unspent Gold Minutes"]` in `final_stats` (`src/lib/stats/normalize.ts`), stored per player per match as `unspentGoldMinutes`, then averaged per match into `Story.roast.avgUnspentGoldMinutes`. Nothing in M1 rescales it.

Checks on `tests/fixtures/api/bulk-metadata.json` (326 player records, the test account's matches and others):

| Check | Result |
|---|---|
| Value against match length in minutes | The value is larger than the match length in minutes in all 326 records, so it is not a count of minutes. |
| Value divided by match minutes | Median 2,354 and duration-weighted mean 2,525, in a plausible range for souls held at once. |
| That figure against the same player's final `net_worth` | Always at or below it, between 4% and 54%. |
| Sibling stat | `Unspent AP Minutes` uses the same naming, which reads as an accumulated value over time. |
| One outlier | An old match (id 55507783) gives 26,145; still below that player's `net_worth`. |

Conclusion: the value behaves like **soul-minutes** (unspent souls summed over each minute). The mean per match divided by the mean match length (`intro.hoursPlayed * 60 / matchCount`) is the duration-weighted average souls held unspent, exactly.

How the slide uses it: "In a typical match you sat on about 2,500 unspent souls." (rounded to the nearest 100). It never says "minutes". If the figure cannot be worked out (zero or missing average, no play time) it shows a neutral sentence with no number. At about 100 souls or fewer it shows a "you spend your souls" line instead.

To close this question for good: confirm with Valve or the deadlock-api maintainers, then add an ADR and set `question_status: resolved` with `resolved_by`.
