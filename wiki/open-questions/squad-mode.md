---
type: Open Question
title: "Squad mode shape"
description: How squad mode is shared, its size limit, and which squad-specific slides and tables it includes.
tags: [squad, ux]
status: draft
question_status: open
recommendation: "A shareable /squad?ids=a,b,c link capped at 6, with squad slides plus a comparison table."
raised_on: 2026-10-06
generated: { by: claude-code/claude-opus-5-5, at: 2026-10-07T00:35:00Z }
---

# Recommendation

- Shareable URL: `/squad?ids=a,b,c`, **capped at 6** players.
- Squad slides: **feeder**, **urn mule**, **best duo**, **most pings**.
- A **comparison table**, including average rank.

# Data notes

- `/v1/players/{id}/mate-stats` and `enemy-stats` support duo stats. `/v1/players/rank` takes batches.
- `pings` and accolade 13 (`returned_idol`) exist per player per match. See [match fields](../research/match-metadata-fields.md).
- Related: [ADR 0002](../decisions/0002-steam-id-no-login.md).
