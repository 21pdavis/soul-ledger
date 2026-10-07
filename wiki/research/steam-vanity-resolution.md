---
type: Reference
title: Resolving Steam vanity URLs
description: How Soul Ledger turns a steamcommunity.com/id/<name> URL into an account id, what failed in production, and the optional Steam Web API path.
tags: [steam, identity, production]
status: stable
generated: { by: claude-code/claude-opus-5-5, at: 2026-10-07T04:30:00Z }
verified: { by: claude-code/claude-opus-5-5, at: 2026-10-07T04:30:00Z }
stale_after: 2027-01-07T00:00:00Z
sources:
  - id: xml
    resource: https://steamcommunity.com/id/DoctorPol/?xml=1
    title: Steam community profile XML
  - id: webapi
    resource: https://developer.valvesoftware.com/wiki/Steam_Web_API
    title: Steam Web API (ISteamUser/ResolveVanityURL)
---

Code: `src/lib/steam/resolve.ts`. Numeric ids (SteamID64/3/2, account id) need no network call. Only vanity names do ([ADR 0002](../decisions/0002-steam-id-no-login.md)).

# Two ways to resolve

| Path | Used when | Notes |
|---|---|---|
| Profile XML `steamcommunity.com/id/<name>/?xml=1`[^xml] | No `STEAM_API_KEY` (the default) | No key needed. `<steamID64>` on success, `<error>` when unknown. It's a public web page, so Steam can rate-limit or challenge it. |
| `ISteamUser/ResolveVanityURL/v1`[^webapi] | `STEAM_API_KEY` is set | The official API. `success: 1` with `steamid`, or `success: 42` for no match. Free key from steamcommunity.com/dev/apikey. The key is never logged. |

The API fixtures (`tests/fixtures/steam/resolve-vanity-*.json`) follow Valve's documented shape. They were **not recorded live**, because there is no key yet. Re-record them once a key exists.

# Production history (2026-10-07)

- Just after the first deploy, three vanity lookups from Render in a row returned `unavailable`, while numeric-id lookups worked. There was no logging, so the cause is **unknown**.
- After failure logging shipped (PR #3), 7 of 7 vanity lookups from Render succeeded through the profile XML. So Steam does **not** block Render's IPs outright; the earlier failures were intermittent.
- Each failure now logs `steam vanity resolve failed for "<name>": <HTTP status or error>` with the start of the response body. If these recur, set `STEAM_API_KEY` on Render.

[^xml]: Steam community profile XML
[^webapi]: Steam Web API (ISteamUser/ResolveVanityURL)
