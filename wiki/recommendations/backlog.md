---
type: Backlog
title: Backlog and recommendations
description: Prioritized list of recommended next steps, research to do, and deferred features.
tags: [backlog, planning]
status: stable
generated: { by: claude-code/claude-opus-5-5, at: 2026-10-07T05:00:00Z }
---

# Next

Tech debt and security hardening have their own [tech-debt register](tech-debt.md), linked to GitHub issues.

| Priority | Item | Links |
|---|---|---|
| P0 | Before the repo goes public at M2, fix every *pre-public* item in the [tech-debt register](tech-debt.md) | [ADR 0032](../decisions/0032-github-private-ci.md) |
| P0 | Start M2: the 11-slide story in 2D, fed by `/api/lookup` | [ADR 0028](../decisions/0028-milestones.md) |
| P2 | In-app What's new page (`/changelog`) rendering `CHANGELOG.md` | [ADR 0041](../decisions/0041-changelog-and-releases.md) |
| P1 | Find out what "Unspent Gold Minutes" counts, and if possible what accolade 11 (breakables) includes, before writing slide copy | [bulk metadata](../research/bulk-match-metadata.md) |
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

- **Hall of Fame (M6)** ranks the fun stats from our own cache, because the API has no distribution for them ([percentile metrics](../research/percentile-metrics.md)).

- Steam OpenID login ([ADR 0002](../decisions/0002-steam-id-no-login.md)).
- Username search like Statlocker's, after the URL-only prototype. The API already has `/v1/players/steam-search` (search by account id or persona name, with a recent-activity weighting) ([API](../research/deadlock-api.md)).
- The "unlock full history" flow ([ADR 0009](../decisions/0009-preview-then-full-history.md), [mechanism](../open-questions/full-history-unlock.md)).
- Video export ([export](../decisions/0011-sharing.md)).

# Standing recommendations

- Filter Street Brawl (`game_mode` 4) out of the main stats or show it separately ([match fields](../research/match-metadata-fields.md)).
- Queue every API fetch server-side behind the per-IP rate limits. Never call the API from the browser.
