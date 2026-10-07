---
type: Decision Record
title: "0008: Rank against global percentiles and a site Hall of Fame"
description: Players get global percentiles from API distributions plus a site-only Hall of Fame for niche stats.
tags: [ranking, data]
status: stable
decision: accepted
decided_on: 2026-10-06
generated: { by: claude-code/claude-opus-5-5, at: 2026-10-06T12:00:00Z }
---

# Decision

- **Global percentiles** come from `/v1/analytics/player-stats/metrics` ([API](../research/deadlock-api.md)) for every stat it supports.
- A **site Hall of Fame** ranks everyone our site has cached. It covers niche stats (crates, Sinner's jackpots, urns) and anything without a global distribution.

# Follow-up

Check which metrics the endpoint supports ([backlog](../recommendations/backlog.md)).
