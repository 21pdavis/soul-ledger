---
type: Decision Record
title: "0037: Squad roles list, without The Backseat Gamer"
description: Nine squad roles, each awarded for the highest per-match value of one stat; The Backseat Gamer (pings) is dropped.
tags: [squad]
status: stable
decision: accepted
decided_on: 2026-10-06
generated: { by: claude-code/claude-opus-5-5, at: 2026-10-07T05:30:00Z }
---

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
| The Hoarder | unspent gold minutes |
| Mid Boss Thief | Rejuvenators claimed |

- **The Backseat Gamer (pings) is dropped.** Ping counts are not in the bulk match data ([bulk metadata](../research/bulk-match-metadata.md)), and the user judged the role unnecessary.
- Unchanged from ADR 0020: every player gets one **headline role**, assigned so nobody is left without one, and extra roles they win show as **badges**. The list stays open to tuning.

Supersedes [ADR 0020](0020-squad-roles.md). Refines [ADR 0010](0010-squad-mode.md).
