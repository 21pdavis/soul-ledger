---
type: Decision Record
title: "0064: Show the win rate over the last 20 matches on the Main and Roster slides"
description: "The Main slide and each top hero on the Roster slide add a quieter second line with the win rate over that hero's newest 20 matches, hidden when the hero has 20 or fewer matches."
tags: [m3-prep, story, stats]
status: stable
decision: accepted
decided_on: 2026-10-09
generated: { by: claude-code/claude-sonnet-5-5, at: 2026-10-09T05:00:00Z }
---

# Decision

The owner asked for a "recent win rate" next to the win rate on the Main slide, chose **the last 20 matches on the hero**, and then asked for the same on the Roster slide (each of the top heroes).

| Question | Answer |
|---|---|
| Where | Main slide, as a quieter second line under the overall win rate ("70% in the last 20 matches"), and under each top hero's win rate on the Roster slide ("70% last 20"). |
| Which matches | The newest 20 on that hero, by start time, inside the chosen window (All time or This patch). |
| Few matches | Hidden when the hero has 20 or fewer matches in the window, because it would repeat the overall rate. |
| Data | `Story.main.recent` and `Story.roster.topHeroes[].recent` (`matches`, `wins`, `winRate`, or `null`), computed in `src/lib/stats/story.ts` with `RECENT_MATCHES = 20`. |

# Why

An overall rate hides whether a player is improving. A fixed 20-match window is easy to say in one line and large enough that one bad night does not swing it. Nothing earlier in the wiki had decided or recorded this; it was raised in conversation on 2026-10-09 and had not been built.
