---
type: Open Question
title: "Unit of avgUnspentGoldMinutes for the unspent-souls roast"
description: "What the Unspent Gold Minutes stat measures (souls times minutes or minutes), which decides how the roast slide can phrase it."
tags: [m2, data, copy]
status: stable
question_status: resolved
resolved_by: ../decisions/0060-owner-decisions-m2-open-questions.md
recommendation: "Resolved by dropping the stat: the project does not use unspent souls (ADR 0060)."
raised_on: 2026-10-07
generated: { by: claude-code/claude-sonnet-5-5, at: 2026-10-08T20:00:00Z }
---

# Context

`Story.roast.avgUnspentGoldMinutes` is the mean per match of `custom_user_stats["Unspent Gold Minutes"]`. The [bulk metadata research](../research/bulk-match-metadata.md) found it averages about 84,800 per match, which looks like souls multiplied by minutes, not minutes. The unit is unverified.

[ADR 0053](../decisions/0053-m2-copy-and-data-presentation.md) says to verify the unit and show it as a plain sentence. The verification is part of the roast slide PR.

# Status

Checked on 2026-10-08 in the M2 roast slide PR. The unit is **inferred from the data, unconfirmed by Valve and not yet accepted by the owner**, so the question stays open. Follow-up work is tracked in #36.

The code path is `custom_user_stats["Unspent Gold Minutes"]` in `final_stats` (`src/lib/stats/normalize.ts`), stored per player per match as `unspentGoldMinutes`, then averaged per match into `Story.roast.avgUnspentGoldMinutes`. Nothing in M1 rescales it.

Checks on `tests/fixtures/api/bulk-metadata.json`: one account's 352 matches, of which 351 are Normal and 1 is Street Brawl (which the story excludes). Figures below are for the 351 Normal matches, 325 of which have the key.

| Check | Result |
|---|---|
| Value against match length in minutes | The value is larger than the match length in minutes in every record with the key, so it is not a count of minutes. |
| Value divided by match minutes | Median about 2,340 and duration-weighted mean about 2,480, in a plausible range for souls held at once. |
| That figure against the same match's final `net_worth` | Always below it, between 4% and 13%. |
| Sibling stat | `Unspent AP Minutes` uses the same naming, which reads as an accumulated value over time. |
| Missing key | 26 of the 351 Normal records have no `Unspent Gold Minutes` key. `normalize.ts` stores 0 for them while their duration stays in the denominator, so the average is understated (about 7% for this account), and a player with many such matches could wrongly look like a spender. |
| Street Brawl record | An old Street Brawl match (id 55507783) gives 26,145 per minute, far above the Normal range. The story excludes it. |

Conclusion: the value behaves like **soul-minutes** (unspent souls summed over each minute). The mean per match divided by the mean match length (`intro.hoursPlayed * 60 / matchCount`) would be the duration-weighted average souls held unspent, once the missing-key bias is fixed.

What ships: the roast slide shows a **neutral sentence with no number and no unit**. The numeric line ("In a typical match you sat on about 2,500 unspent souls", rounded to the nearest 100) is built and tested but switched off by `SHOW_UNSPENT_SOULS_FIGURE` in `src/story/copy.ts`.

**Owner decision, 2026-10-08 ([ADR 0055](../decisions/0055-owner-confirmations-after-m2.md)):** no number for now. Showing one is a to-do for the owner or the next milestone, tracked in #36. The question stays open because the unit is still unconfirmed.

To close this question: confirm the unit with Valve or the deadlock-api maintainers, fix the missing-key bias in `normalize.ts`, add an ADR, set `question_status: resolved` with `resolved_by`, and flip the switch (all in #36).

# Resolution

Owner decision, 2026-10-08 ([ADR 0060](../decisions/0060-owner-decisions-m2-open-questions.md)): drop the stat. The unit stayed unverified, the stat is not in the OpenAPI spec, and web searches found no mention. The DB column and `normalize.ts` parsing stay unused. #36 is closed as not planned. The Hoarder squad role lost its source: see [its open question](hoarder-role-source.md).
