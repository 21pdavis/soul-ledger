---
type: Decision Record
title: "0063: Show recent win rates next to all-time"
description: "The main and roster slides show the all-time win rate beside a recent one (latest 300 matches overall, latest 50 per hero), with an arrow when they differ by 3 points or more."
tags: [m2, story, stats, win-rate]
status: stable
decision: accepted
decided_on: 2026-10-08
generated: { by: claude-code/claude-sonnet-5-5, at: 2026-10-08T19:30:00Z }
---

# Decision

The owner improves over time, so early games drag the all-time win rate down. Every match is stored (`player_matches`), so no API change is needed.

| | Rule |
|---|---|
| Overall recent | The player's latest 300 counted matches (by start time) |
| Per hero recent (main, top heroes) | That hero's latest 50 matches |
| Shown only when | The player (or hero) has more matches than the window, so the recent figure is a real subset |
| Arrow | Up or down when recent differs from all-time by 3 points or more, none otherwise |
| Where | `RECENT_MATCHES` and `RECENT_HERO_MATCHES` in `src/lib/stats/story.ts`; copy in `src/story/copy.ts` (`recentTrend`) |

Main slide: the recent rate sits under the all-time win rate. Roster slide: an "All time X% win rate / recent Y%" line, and a recent figure in each top-hero row. Intro and summary slides are unchanged.
