---
type: Reference
title: Match metadata fields
description: The per-player and match-level fields in deadlock-api match metadata and which Wrapped stats each one feeds.
resource: https://api.deadlock-api.com/openapi.json
tags: [data-source, schema, match-metadata]
status: stable
generated: { by: claude-code/claude-opus-5-5, at: 2026-10-07T05:00:00Z }
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

# Accolade ids

The full list of 31, fetched from `/v1/assets/accolades` on 2026-10-06.[^accolades] Which ids feed which slide: [bulk match metadata](bulk-match-metadata.md).

| id | Name |
|---|---|
| 1 | `kills` |
| 2 | `assists` |
| 3 | `healing` |
| 4 | `player_damage` |
| 5 | `net_worth` |
| 6 | `trooper_last_hits` |
| 7 | `neutral_last_hits` |
| 8 | `last_hits` |
| 9 | `secures` |
| 10 | `denies` |
| 11 | `breakables_destroyed` |
| 12 | `pickups_collected_powerup` |
| 13 | `returned_idol` |
| 14 | `sinners_sacrifice_jackpot` |
| 15 | `first_blood` |
| 16 | `killstreak_kills` |
| 17 | `closeup_kills` |
| 18 | `long_distance_kills` |
| 19 | `gun_kills` |
| 20 | `melee_kills` |
| 21 | `ability_kills` |
| 22 | `bullet_damage` |
| 23 | `melee_damage` |
| 24 | `ability_damage` |
| 25 | `weapon_damage` |
| 26 | `damage_absorbed` |
| 27 | `damage_mitigated` |
| 28 | `headshots` |
| 29 | `headshot_damage` |
| 30 | `closeup_damage` |
| 31 | `long_distance_damage` |

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
