---
type: Backlog
title: Backlog and recommendations
description: Prioritized list of recommended next steps, research to do, and deferred features.
tags: [backlog, planning]
status: stable
generated: { by: claude-code/claude-opus-5-5, at: 2026-10-07T05:00:00Z }
---

# Next

| Priority | Item | Links |
|---|---|---|
| P0 | Confirm the [M1 implementation choices](../open-questions/m1-implementation-choices.md) | |
| P0 | Start M2: the 11-slide story in 2D, fed by `/api/lookup` | [ADR 0028](../decisions/0028-milestones.md) |
| P1 | Find out what "Unspent Gold Minutes" counts, and if possible what accolade 11 (breakables) includes, before writing slide copy | [bulk metadata](../research/bulk-match-metadata.md) |
| P1 | Bump GitHub Actions to Node 24 versions (checkout, setup-node, pnpm action), which CI flags as deprecated | [ADR 0032](../decisions/0032-github-private-ci.md) |
| P1 | Read and cite Valve's fan content policy | [monetization](../open-questions/monetization.md) |
| P2 | Source or commission occult-jazz music, and check licenses | [ADR 0006](../decisions/0006-audio.md) |

# Done

- **M1 data layer** (2026-10-06): Steam input parsing and resolution, the deadlock-api client with rate limits, the Postgres cache with job lock, incremental sync, story stats, global and same-hero percentiles, and `GET /api/lookup` (NDJSON stream). Covered by unit, integration (PGlite) and e2e smoke tests, with CI.
- Cache schema designed (`src/db/schema.ts`).
- Neon `main` migrated, and the Render Blueprint added ([ADR 0039](../decisions/0039-render-free-blueprint.md)).
- Metrics supported by the percentile endpoint: see [percentile metrics](../research/percentile-metrics.md).
- Full accolade list: see [match fields](../research/match-metadata-fields.md).
- Patch dates: [ADR 0035](../decisions/0035-patch-date-from-changelog-title.md).

# Later / deferred features

- **Rate limiting is per process.** That's fine for one Render instance. Several instances would need a shared limiter (Postgres or Key Value).
- **Hall of Fame (M6)** ranks the fun stats from our own cache, because the API has no distribution for them ([percentile metrics](../research/percentile-metrics.md)).

- Steam OpenID login ([ADR 0002](../decisions/0002-steam-id-no-login.md)).
- Username search like Statlocker's, after the URL-only prototype. The API already has `/v1/players/steam-search` (search by account id or persona name, with a recent-activity weighting) ([API](../research/deadlock-api.md)).
- The "unlock full history" flow ([ADR 0009](../decisions/0009-preview-then-full-history.md), [mechanism](../open-questions/full-history-unlock.md)).
- Video export ([export](../decisions/0011-sharing.md)).

# Standing recommendations

- Filter Street Brawl (`game_mode` 4) out of the main stats or show it separately ([match fields](../research/match-metadata-fields.md)).
- Queue every API fetch server-side behind the per-IP rate limits. Never call the API from the browser.
