---
type: Reference
title: Global percentile metrics
description: Which stats /v1/analytics/player-stats/metrics can rank, what its accuracy and crit metrics mean, and how M1 turns quantiles into percentiles.
resource: https://api.deadlock-api.com/v1/analytics/player-stats/metrics
tags: [data-source, api, percentiles]
status: stable
generated: { by: claude-code/claude-opus-5-5, at: 2026-10-07T05:00:00Z }
verified: { by: claude-code/claude-opus-5-5, at: 2026-10-07T05:00:00Z }
stale_after: 2027-01-07T00:00:00Z
sources:
  - id: openapi
    resource: https://api.deadlock-api.com/openapi.json
    title: deadlock-api OpenAPI spec
---

Checked on 2026-10-06.[^openapi] This resolves the backlog item "check which metrics the endpoint supports".

# What it returns

For each metric: `avg`, `std` and `percentile1/5/10/25/50/75/90/95/99`. These are DDSketch quantiles of **per-match, per-player values** with a relative error of at most 1%.

- Default window is the **last 30 days**, and the default mode is normal ranked plus unranked.
- `hero_ids` filters to one hero. This is used for the main-hero and MVP same-hero comparisons ([ADR 0021](../decisions/0021-kill-slides-and-mvp.md)).
- Cached 6 h by the API. We cache it 6 h in Postgres too (`api_cache`).

# Available metrics

`assists, kd, kda, kills, deaths, kills_plus_assists, net_worth, net_worth_per_min, last_hits, denies, accuracy, crit_shot_rate, player_damage, player_damage_per_min, player_damage_per_health, player_damage_taken_per_min, boss_damage, boss_damage_per_min, neutral_damage, neutral_damage_per_min, healing, healing_per_min, player_healing, player_healing_per_min, self_healing, self_healing_per_min, teammate_healing, teammate_barriering, heal_prevented`

**None of the fun stats** (crates, Sinner's jackpots, urns, parries, melee kills) have a global distribution. They can only be ranked against our own cache, as the Hall of Fame ([ADR 0008](../decisions/0008-ranking-population.md)).

# Definitions, worked out from the data

| Metric | Means | Evidence |
|---|---|---|
| `accuracy` | **All** shots: `shots_hit / (shots_hit + shots_missed)` | Global median 0.53. The test account's all-shots median is 0.59, while their hero-only accuracy is 0.34. |
| `crit_shot_rate` | `hero_bullets_hit_crit / hero_bullets_hit` | Global median 0.14 against the test account's 0.19 |

# How M1 ranks a player

The code is `src/lib/stats/percentiles.ts`.

- **Interpolation:** linear between the published quantiles. Below p1 gives 0.5 and above p99 gives 99.5. A value sitting on a run of equal quantiles (for example, half of all players heal teammates for 0) lands mid-run.
- **Caveat:** we compare a player's **average** over many matches against a **per-match** distribution. Averages vary less, so extremes are exaggerated. That is acceptable for a Wrapped story, but copy should not claim rigour.
- Rates (`accuracy`, `crit_shot_rate`, `kda`, per-minute stats) are computed from totals, not as averages of per-match ratios.

[^openapi]: deadlock-api OpenAPI spec
