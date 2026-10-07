---
type: Backlog
title: Backlog and recommendations
description: Prioritized list of recommended next steps, research to do, and deferred features.
tags: [backlog, planning]
status: stable
generated: { by: claude-code/claude-opus-5-5, at: 2026-10-07T00:35:00Z }
---

# Next (before code)

| Priority | Item | Links |
|---|---|---|
| P0 | Write failing tests first, then build M1 (data layer) | [ADR 0028](../decisions/0028-milestones.md), [ADR 0029](../decisions/0029-testing-tdd.md) |
| P0 | Design the Postgres cache schema (players, matches, per-player match rows, fetch state) | [ADR 0001](../decisions/0001-public-site-postgres-cache.md) |
| P1 | Find a reliable source for patch dates to support the "this patch" toggle | [ADR 0004](../decisions/0004-time-window.md) |
| P1 | Check which metrics `/v1/analytics/player-stats/metrics` supports for percentiles, especially the fun stats | [API](../research/deadlock-api.md) |
| P1 | Fetch the full accolade id list and add it to the research page | [match fields](../research/match-metadata-fields.md) |
| P1 | Read and cite Valve's fan content policy | [monetization](../open-questions/monetization.md) |
| P2 | Source or commission occult-jazz music, and check licenses | [ADR 0006](../decisions/0006-audio.md) |

# Later / deferred features

- Steam OpenID login ([ADR 0002](../decisions/0002-steam-id-no-login.md)).
- Username search like Statlocker's, after the URL-only prototype. The API already has `/v1/players/steam-search` (search by account id or persona name, with a recent-activity weighting) ([API](../research/deadlock-api.md)).
- The "unlock full history" flow ([ADR 0009](../decisions/0009-preview-then-full-history.md), [mechanism](../open-questions/full-history-unlock.md)).
- Video export ([export](../decisions/0011-sharing.md)).

# Standing recommendations

- Filter Street Brawl (`game_mode` 4) out of the main stats or show it separately ([match fields](../research/match-metadata-fields.md)).
- Queue every API fetch server-side behind the per-IP rate limits. Never call the API from the browser.
