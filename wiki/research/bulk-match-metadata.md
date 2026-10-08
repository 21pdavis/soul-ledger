---
type: Reference
title: Bulk match metadata for one player
description: How M1 fetches a player's whole history from /v1/matches/metadata in one or a few requests, and the data quirks found in the response.
resource: https://api.deadlock-api.com/openapi.json
tags: [data-source, api, deadlock-api, ingest]
status: stable
generated: { by: claude-code/claude-opus-5-5, at: 2026-10-07T05:00:00Z }
verified: { by: claude-code/claude-opus-5-5, at: 2026-10-07T05:00:00Z }
stale_after: 2027-01-07T00:00:00Z
sources:
  - id: openapi
    resource: https://api.deadlock-api.com/openapi.json
    title: deadlock-api OpenAPI spec
---

Checked against the live API on 2026-10-06 with the [test account](test-account.md).[^openapi]

# The request

`/v1/matches/metadata` with these parameters returns one player's data for many matches at once:

| Parameter | Value | Why |
|---|---|---|
| `match_ids` | up to 500 ids per request | Only fetch matches we don't have yet ([ADR 0001](../decisions/0001-public-site-postgres-cache.md)). |
| `account_ids` + `only_filtered_players=true` | the player | Drops the other 11 players from the response. |
| `include_player_info=true` | | Accolades, power-ups, team. |
| `include_player_final_stats=true` | | The last sample of every `stats.*` series as one `final_stats` object. Far cheaper than the full time series. |
| `include_player_death_details=true` | | Death positions for the heatmap. |
| `include_mid_boss=true` | | Rejuvenator kills and claims. |

# Measurements

- **All 352 matches came back in a single request**, in 1.5 s, at about 8 KB per match (2.8 MB total).
- At the 30 req/min IP limit, a 650-match history takes 7 requests in batches of 100. A cold live lookup took about 8 s end to end.
- Street Brawl matches are included unless filtered. `game_mode` is a string here (`"Normal"`, `"StreetBrawl"`), but an integer in match-history (1, 4).
- `match_mode` in match-history: **1 = Unranked, 4 = Ranked**. Bulk metadata defaults to `ranked,unranked`, so ingest ignores other modes in the history. Otherwise it would re-request them on every visit.
- `start_time` is a UTC string, `"YYYY-MM-DD HH:MM:SS"`.

# Where each slide stat comes from

| Stat | Source |
|---|---|
| Bullet, ability, melee and headshot kills | `final_stats.*_kills`. They add up to total kills (2244 of 2249 for the test account). |
| Close-up and long-distance kills | Accolades 17 and 18 |
| Crates (breakables) | Accolade 11 |
| Sinner's Sacrifice jackpots | Accolade 14 |
| Idols returned (urns) | Accolade 13. It is absent when 0. |
| Power-ups collected | Accolade 12 |
| Hero accuracy and headshots | `custom_user_stats["Enemy Hero Accuracy##Shots/Hits/Headshots"]` |
| Parries | `custom_user_stats["Parry Success"]`, `["Parry Miss"]` |
| Hoarded souls | `custom_user_stats["Unspent Gold Minutes"]` |
| Rejuvenators | `mid_boss[]`: `team_claimed` equal to the player's team; a **steal** is when `team_killed` differs |

# Quirks and caveats

- **Melee kills disagree:** accolade 20 sums to 139, but `final_stats.melee_kills` sums to 184. We use `final_stats`.
- **Breakables look high but behave well.** Across the test account's 351 normal matches:
  - per match: mean 109, standard deviation 44 (CV 0.41); p10 57, median 102, p90 170; range 11-249.
  - per minute: p10 1.8, median 2.9, p90 4.2. It correlates 0.59 with match length.
  - by hero (median per minute, at least 10 games): 2.3 (Dynamo) to 3.7 (The Doorman).

  There is real spread, and it tracks game length and play style, so it works for ranking and the Crate Goblin role. The absolute count probably includes every breakable prop, not just crates, so slide copy should say "breakables smashed" rather than "crates". **What it counts is unverified.**
- **Unspent Gold Minutes** averages about 84,800 per match. That looks like souls × minutes, not minutes. Checked against the recorded fixture on 2026-10-08: it fits souls × minutes (see the [open question](../open-questions/m2-unspent-souls-unit.md)), but Valve has not documented it, and 26 of 351 Normal records lack the key (stored as 0), so roast copy never says "minutes" for now (#36).
- An accolade missing from the list means a value of 0.
- **Pings are not in the bulk player data.** The Backseat Gamer role was dropped ([ADR 0037](../decisions/0037-squad-roles-without-backseat-gamer.md)).

[^openapi]: deadlock-api OpenAPI spec
