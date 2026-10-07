---
type: Reference
title: gold_sources enum (EGoldSource)
description: The protobuf EGoldSource enum values used in per-player gold_sources stats, including Sinner's Sacrifice and breakables.
resource: https://github.com/SteamDatabase/Protobufs/blob/master/deadlock/citadel_gcmessages_common.proto
tags: [data-source, enum, protobuf]
status: stable
generated: { by: claude-code/claude-opus-5-5, at: 2026-10-07T00:35:00Z }
verified: { by: claude-code/claude-opus-5-5, at: 2026-10-06T00:00:00Z }
stale_after: 2027-01-06T00:00:00Z
sources:
  - id: proto
    resource: https://github.com/SteamDatabase/Protobufs/blob/master/deadlock/citadel_gcmessages_common.proto
    title: SteamDatabase Deadlock protobufs (CMsgMatchMetaDataContents.EGoldSource)
---

`gold_sources` in the per-player `stats` time series ([match fields](match-metadata-fields.md)) is keyed by `CMsgMatchMetaDataContents.EGoldSource`.[^proto]

# Schema

| Value | Name | Wrapped use |
|---|---|---|
| 1 | Players | |
| 2 | LaneCreeps | |
| 3 | Neutrals | |
| 4 | Bosses | |
| 5 | Treasure | |
| 6 | Assists | |
| 7 | Denies | |
| 8 | TeamBonus | |
| 9 | AbilityAssassinate | |
| 10 | ItemTrophyCollector | |
| 11 | ItemCultistSacrifice | **Sinner's Sacrifice**: Gambler slide |
| 12 | Breakable | **Crates/boxes**: Crate Goblin slide |
| 13 | ItemGooseEgg | |

[^proto]: SteamDatabase Deadlock protobufs (CMsgMatchMetaDataContents.EGoldSource)
