---
type: Reference
title: Match metadata fields
description: The per-player and match-level fields in deadlock-api match metadata and which Wrapped stats each one feeds.
resource: https://api.deadlock-api.com/openapi.json
tags: [data-source, schema, match-metadata]
status: stable
generated: { by: claude-code/claude-opus-5-5, at: 2026-10-07T00:35:00Z }
verified: { by: claude-code/claude-opus-5-5, at: 2026-10-06T00:00:00Z }
stale_after: 2027-01-06T00:00:00Z
sources:
  - id: openapi
    resource: https://api.deadlock-api.com/openapi.json
    title: deadlock-api OpenAPI spec
  - id: accolades
    resource: https://api.deadlock-api.com/v1/assets/accolades
    title: deadlock-api accolades asset list
---

From `/v1/matches/{match_id}/metadata` ([API](deadlock-api.md)), observed on 2026-10-06.[^openapi]

# Schema: per-player fields

| Field | Contents |
|---|---|
| basics | kills, deaths, assists, `net_worth`, `last_hits`, `denies`, `level` |
| items | Items with purchase and sold timestamps |
| `ability_stats` | Per-ability stats |
| `death_details` | `game_time`, `time_to_kill`, killer slot, `death_pos`, `killer_pos`, death duration |
| `stats` (time series) | player/boss/creep damage, healing, shots hit/missed, hero bullets hit and crit, bullet/melee/ability/headshot kills, damage mitigated/absorbed, `gold_sources` ([enum](gold-sources.md)) |
| `custom_user_stats` | accuracy, headshots, Parry Success/Miss, Unspent Gold Minutes, bullet/ability distance buckets, falloff |
| `accolades` | Accolade ids, mapped via `/v1/assets/accolades` (see below) |
| `power_up_buffs` | Power-ups with pickup times |
| `pings` | Ping counts |
| `player_rank_data` | Rank data |

# Accolade ids (partial)

Mapped via `/v1/assets/accolades`.[^accolades]

| id | Name |
|---|---|
| 11 | `breakables_destroyed` |
| 12 | `pickups_collected_powerup` |
| 13 | `returned_idol` |
| 14 | `sinners_sacrifice_jackpot` |
| 15 | `first_blood` |
| 17 | `closeup_kills` |
| 18 | `long_distance_kills` |
| 20 | `melee_kills` |
| 28 | `headshots` |

More ids exist. Fetch the full list from the endpoint when implementing.

# Schema: match-level fields

| Field | Contents |
|---|---|
| `mid_boss` | Team that killed/claimed it, and when |
| `objectives` | Objective destruction events |
| `match_paths` | Movement paths per player |
| `damage_matrix` | Who damaged whom |
| average badges | Average rank badges in the match |

# Game modes

| `game_mode` | Meaning | Handling |
|---|---|---|
| 1 | Normal | Main data set |
| 4 | Street Brawl | Short matches, mostly zeroed stats. **Filter out or handle separately.** |

[^openapi]: deadlock-api OpenAPI spec
[^accolades]: deadlock-api accolades asset list
