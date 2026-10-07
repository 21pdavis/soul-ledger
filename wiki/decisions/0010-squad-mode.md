---
type: Decision Record
title: "0010: Squad mode via a shareable link of up to 6 players, with role assignment"
description: Friends compare via /squad?ids=..., up to 6 players, with assigned team roles and a comparison table.
tags: [squad, social]
status: stable
decision: accepted
decided_on: 2026-10-06
generated: { by: claude-code/claude-opus-5-5, at: 2026-10-06T12:00:00Z }
---

# Decision

- One shareable link, `/squad?ids=a,b,c`, holds up to **6** players and needs no accounts.
- **Squad Wrapped** assigns each player a role (the feeder, the urn mule, and so on). The user especially likes this. The role list is in [squad roles](0037-squad-roles-without-backseat-gamer.md).
- It includes a side-by-side comparison table and the squad's average rank, computed with `/v1/players/rank` batch and `mate-stats`.
- Build order: the solo story ships first. The data layer supports squads from day one.
