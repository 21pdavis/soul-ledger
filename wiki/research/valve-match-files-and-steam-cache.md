---
type: Reference
title: Valve match files and the Steam cache
description: "How match IDs and salts sit in Steam's httpcache, how Valve serves match files from them, and why a cache upload can't give full history (local experiment, 2026-10-08, scrapped)."
tags: [data-source, valve, steam-cache, ingest]
status: draft
generated: { by: claude-code/claude-sonnet-5-5, at: 2026-10-08T18:00:00Z }
stale_after: 2027-01-08T00:00:00Z
sources:
  - id: ingest-cache
    resource: https://deadlock-api.com/ingest-cache
    title: deadlock-api ingest-cache page, read 2026-10-08
  - id: ingest-repo
    resource: https://github.com/deadlock-api/deadlock-api-ingest
    title: deadlock-api-ingest (scan_cache.rs), read by a research agent 2026-10-08
---

A short local experiment (code deleted, never pushed) tested whether the player's own Steam cache could replace deadlock-api. **The owner scrapped it**: the cache only covers recent matches. This page keeps what was learned.

# Findings

- **Where the keys live.** Steam's `appcache/httpcache` (Windows: `C:\Program Files (x86)\Steam\appcache\httpcache`) holds files named `<sha1>_<sha1>` in subfolders (`00`, `01`, ...). The first ~200 bytes of a Deadlock entry hold `replayNNN.valve.net\0/1422450/<matchId>_<salt>.meta.bz2`.[^repo] 1422450 is Deadlock's Steam app id. The salt is a u32.
- **Valve serves the match file with no login.** `http://replay{cluster}.valve.net/1422450/{matchId}_{salt}.meta.bz2` returned the file (about 196 KB, served from Google Cloud Storage). The cluster number comes from the cached host.[^repo]
- **Format.** bz2-compressed protobuf (`CMsgMatchMetaData`, definitions in SteamDatabase/GameTracking-Deadlock). The experiment decoded one real match (duration, 12 players, winner, kills/deaths/assists).
- **No CORS headers**, so a browser can't fetch it; it needs a server.
- **Coverage is the limit.** The owner's cache held 1,399 files and only **5 Deadlock matches**, all `.meta.bz2` and no `.dem.bz2`. The game saves a salt only when it shows that match, so the cache is recent matches only, the same limit the ingest-cache page states.[^ingest]
- **Terms are unknown.** No Valve statement on third-party use of these files was found. The Steam Web API terms cover the Web API, not these files. deadlock-api says it is not endorsed by Valve. The URL is unsupported and could change.

# Decision

Not pursued ([open question](../open-questions/full-history-unlock.md) stays as is): full history still needs the bot-friend flow or the Patreon tier ([ADR 0017](../decisions/0017-full-history-via-patreon-for-now.md)), and deadlock-api stays the data source.

[^ingest]: deadlock-api ingest-cache page, read 2026-10-08
[^repo]: deadlock-api-ingest `src/scan_cache.rs`, read by a research agent 2026-10-08; the download was checked once with a ranged request against the repo's own test URL
