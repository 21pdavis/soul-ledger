---
type: Reference
title: deadlock-api.com endpoints and limits
description: The deadlock-api.com endpoints Deadlock Wrapped needs, with their rate limits and coverage caveats.
resource: https://api.deadlock-api.com/openapi.json
tags: [data-source, api, deadlock-api]
status: stable
generated: { by: claude-code/claude-opus-5-5, at: 2026-10-07T00:35:00Z }
verified: { by: claude-code/claude-opus-5-5, at: 2026-10-06T00:00:00Z }
stale_after: 2027-01-06T00:00:00Z
sources:
  - id: openapi
    resource: https://api.deadlock-api.com/openapi.json
    title: deadlock-api OpenAPI spec
  - id: datalake
    resource: https://data.deadlock-api.com
    title: deadlock-api data lake (DuckDB/DuckLake)
---

Verified against the live API on 2026-10-06.[^openapi]

# Player endpoints

| Endpoint | Use | Notes |
|---|---|---|
| `/v1/players/{account_id}/match-history` | List of a player's matches | Stored history only, unless the account friends the API's Steam bot. One sample player had 63 matches back to 2024-09, so **coverage is incomplete** ([open question](../open-questions/incomplete-match-history.md)). |
| `/v1/players/{id}/rank`, `/v1/players/rank` | Rank (single / batch) | Batch is useful for [squad mode](../open-questions/squad-mode.md). |
| `/v1/players/{id}/mate-stats`, `/v1/players/{id}/enemy-stats` | Duo and rival stats | |
| `/v1/players/steam`, `/v1/players/steam-search` | Steam profile lookup / search | For resolving pasted URLs ([ADR 0002](../decisions/0002-steam-id-no-login.md)). |
| `account-stats` | | **Patreon-only**. Not usable. |

# Match endpoints

| Endpoint | Use | Notes |
|---|---|---|
| `/v1/matches/{match_id}/metadata` | Full per-match JSON | See [match fields](match-metadata-fields.md). |
| `/v1/matches/metadata` | Bulk metadata | Filterable by `account_ids`, with `include_player_*` flags. **IP limit 30 req/min.** |

# Analytics endpoints

| Endpoint | Use | Notes |
|---|---|---|
| `/v1/analytics/player-stats/metrics` | Global quantiles (DDSketch) | Cached 6h. Basis for [percentile rankings](../open-questions/ranking-population.md). |
| `/v1/analytics/scoreboards/players` | Player leaderboards | |

All analytics endpoints share **200 req/min per IP**.

# Assets

`/v1/assets/*`: heroes, items, ranks, map, sounds, accolades. **Don't use the sounds** ([ADR 0006](../decisions/0006-audio.md)).

# SQL and data lake

- `/v1/sql` is **deprecated** in favour of the data lake at https://data.deadlock-api.com (DuckDB/DuckLake).[^datalake] It is also exposed through an MCP server at `/v1/mcp`.
- A demo/replay SQL query endpoint exists. It is async, takes ~55 s per query, and is limited to 200/h per IP. Not suitable for interactive use.

# Not available

- Queue times.

# Implications

- Rate limits are per IP, so the server must cache in Postgres ([ADR 0001](../decisions/0001-public-site-postgres-cache.md)) and queue fetches.

[^openapi]: deadlock-api OpenAPI spec
[^datalake]: deadlock-api data lake (DuckDB/DuckLake)
