---
type: Decision Record
title: "0064: Show the win rate over the last 20 matches next to the main hero's overall win rate"
description: "The Main slide adds a quieter second line with the win rate over the newest 20 matches on the main hero, hidden when the hero has 20 or fewer matches."
tags: [m3-prep, story, stats]
status: stable
decision: accepted
decided_on: 2026-10-09
generated: { by: claude-code/claude-sonnet-5-5, at: 2026-10-09T05:00:00Z }
---

# Decision

The owner asked for a "recent win rate" next to the win rate on the Main slide, and chose **the last 20 matches on the main hero**.

| Question | Answer |
|---|---|
| Where | Main slide, as a quieter second line under the overall win rate ("70% in the last 20 matches"). |
| Which matches | The newest 20 on the main hero, by start time, inside the chosen window (All time or This patch). |
| Few matches | Hidden when the hero has 20 or fewer matches in the window, because it would repeat the overall rate. |
| Data | `Story.main.recent` (`matches`, `wins`, `winRate`, or `null`), computed in `src/lib/stats/story.ts` with `RECENT_MATCHES = 20`. |

# Why

An overall rate hides whether a player is improving. A fixed 20-match window is easy to say in one line and large enough that one bad night does not swing it. Nothing earlier in the wiki had decided or recorded this; it was raised in conversation on 2026-10-09 and had not been built.
