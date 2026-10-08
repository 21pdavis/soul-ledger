---
type: Decision Record
title: "0020: Squad roles list and assignment"
description: Ten squad roles, each awarded for the highest per-match value of one stat; every player gets one headline role, and extras show as badges.
tags: [squad]
status: deprecated
decision: superseded
superseded_by: 0037-squad-roles-without-backseat-gamer.md
decided_on: 2026-10-06
generated: { by: claude-code/claude-opus-5-5, at: 2026-10-06T14:00:00Z }
---

> **Superseded** by [ADR 0037](0037-squad-roles-without-backseat-gamer.md), which drops The Backseat Gamer.

# Decision

| Role | Stat (per match) |
|---|---|
| The Feeder | deaths |
| Crate Goblin | breakables destroyed |
| Urn Mule | idols returned |
| The Carry | hero damage |
| The Medic | teammate healing |
| The Sniper | long-distance kills |
| Parry God | parries landed |
| The Hoarder | unspent gold minutes (stat dropped, see [open question](../open-questions/hoarder-role-source.md)) |
| The Backseat Gamer | pings |
| Mid Boss Thief | Rejuvenators claimed |

- Every player gets one **headline role**, assigned so nobody is left without one.
- Additional roles a player wins show as **badges**.
- The user accepted this list "for now", so it is open to tuning.

Refines [ADR 0010](0010-squad-mode.md).
