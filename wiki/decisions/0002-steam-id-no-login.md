---
type: Decision Record
title: "0002: Identify players by Steam URL/ID with no login, plus a squad mode"
description: Players paste a Steam profile URL or ID with no login, Steam OpenID may come later, and friends can load each other into a squad comparison.
tags: [identity, squad, ux]
status: stable
decision: accepted
decided_on: 2026-10-06
generated: { by: claude-code/claude-opus-5-5, at: 2026-10-07T00:35:00Z }
---

# Decision

- Players are identified by pasting a **Steam profile URL or ID** (vanity URL, profile URL, SteamID64, or account ID). No login is needed.
- **Steam OpenID** sign-in may be added later.
- **Squad mode**: friends load themselves in to compare: average rank, head-to-head stats, and so on. See [squad mode](../decisions/0010-squad-mode.md).

# Notes

- Resolving vanity URLs and searching: deadlock-api offers `/v1/players/steam` and `steam-search` (see [API endpoints](../research/deadlock-api.md)).
- Because there is no auth, anyone can look up anyone. That is acceptable because the data is already public through the API.
