---
type: Open Question
title: "Ranking population: global percentiles, a site Hall of Fame, or both?"
description: Which population players are ranked against, either global API distributions or our own site users.
tags: [ranking, data]
status: draft
question_status: open
recommendation: "Both: global percentiles from the API plus a site-only Hall of Fame."
raised_on: 2026-10-06
generated: { by: claude-code/claude-opus-5-5, at: 2026-10-07T00:35:00Z }
---

# Question

Who do we rank players against?

# Options

1. **Global percentiles** from the API's distributions: `/v1/analytics/player-stats/metrics` returns DDSketch quantiles, cached for 6h (see [API](../research/deadlock-api.md)).
2. **Site-only Hall of Fame**, computed from players cached in our own Postgres ([ADR 0001](../decisions/0001-public-site-postgres-cache.md)).

# Recommendation

**Both.** Global percentiles give meaningful "top X%" claims. The Hall of Fame adds a social, competitive layer.

# Caveat

Fun stats such as breakables may not have global distributions. Check which metrics the endpoint supports.
