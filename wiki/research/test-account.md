---
type: Reference
title: Primary test account
description: The user's own Deadlock account, used as the main development and test case.
tags: [testing, data-source]
status: stable
generated: { by: claude-code/claude-opus-5-5, at: 2026-10-06T16:00:00Z }
verified: { by: claude-code/claude-opus-5-5, at: 2026-10-06T16:00:00Z }
stale_after: 2026-11-06T00:00:00Z
---

- **Steam profile:** https://steamcommunity.com/id/DoctorPol/ (vanity URL)
- **SteamID64:** 76561198095017559, resolved through the profile's `?xml=1` endpoint
- **account_id** (SteamID3, which the API uses): **134751831** (SteamID64 minus 76561197960265728)
- **Match history on 2026-10-06, before the Patreon tier:** 352 stored matches from 2026-01-30 to 2026-10-06. That is 351 normal (`game_mode` 1) and 1 Street Brawl (`game_mode` 4).
- **Rank:** badge 81, which is **Oracle 1** (tier 8, subrank 1). Tier names come from `/v1/assets/ranks`.

**Coverage:** the user reports about **650** total games, so the free API already holds about **54%** (352 of 650), more than expected. That may be statistically enough without the Patreon unlock. Whether to pay is now "we'll see" (2026-10-06).

Under [ADR 0017](../decisions/0017-full-history-via-patreon-for-now.md), the user will subscribe to the $1.50 deadlock-api tier for this account. Re-check the match count afterwards to measure how much history the unlock adds. That measurement also tells us what to promise on the public unlock screen.

Use this account to record test fixtures ([ADR 0029](../decisions/0029-testing-tdd.md)).
