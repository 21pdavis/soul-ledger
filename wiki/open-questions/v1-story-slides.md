---
type: Open Question
title: "v1 story: 12 slides"
description: The proposed list and order of the 12 slides in the v1 Wrapped story.
tags: [story, slides]
status: draft
question_status: open
recommendation: "Adopt the 12-slide list below."
raised_on: 2026-10-06
generated: { by: claude-code/claude-opus-5-5, at: 2026-10-07T00:35:00Z }
---

# Proposed slides

| # | Slide | Data source (see [match fields](../research/match-metadata-fields.md)) |
|---|---|---|
| 1 | Intro totals (matches, hours, K/D/A) | match history, per-player basics |
| 2 | Main hero + win-rate percentile | hero ids, results, [global metrics](../research/deadlock-api.md) |
| 3 | Roster breadth | distinct heroes played |
| 4 | **Crate Goblin**: breakables | accolade 11 `breakables_destroyed`, gold source 12 Breakable |
| 5 | **Gambler**: Sinner's Sacrifice | gold source 11 ItemCultistSacrifice, accolade 14 jackpot |
| 6 | **Urn Mule**: idols returned | accolade 13 `returned_idol` |
| 7 | **Sharpshooter**: headshots and accuracy | `custom_user_stats` accuracy/headshots, accolade 28 |
| 8 | **Parry King / Clown** | `custom_user_stats` Parry Success/Miss |
| 9 | Mid Boss Rejuvenators | match `mid_boss` (killed/claimed) |
| 10 | **Roast**: death heatmap + unspent souls | `death_details.death_pos`, Unspent Gold Minutes |
| 11 | Rank journey | `player_rank_data`, `/v1/players/{id}/rank` |
| 12 | Summary card | all of the above, plus the export ([export](export-format.md)) |

Tone follows [ADR 0007](../decisions/0007-tone-hype-with-roasts.md).
