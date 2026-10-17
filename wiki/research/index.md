# Data-source research

* [deadlock-api.com endpoints and limits](deadlock-api.md) - The deadlock-api.com endpoints Soul Ledger needs, with their rate limits and coverage caveats.
* [Match metadata fields](match-metadata-fields.md) - The per-player and match-level fields in deadlock-api match metadata and which Wrapped stats each one feeds.
* [Bulk match metadata for one player](bulk-match-metadata.md) - How M1 fetches a player's whole history from /v1/matches/metadata in one or a few requests, and the data quirks found in the response.
* [Global percentile metrics](percentile-metrics.md) - Which stats /v1/analytics/player-stats/metrics can rank, what its accuracy and crit metrics mean, and how M1 turns quantiles into percentiles.
* [Resolving Steam vanity URLs](steam-vanity-resolution.md) - How Soul Ledger turns a steamcommunity.com/id/<name> URL into an account id, what failed in production, and the optional Steam Web API path.
* [gold_sources enum (EGoldSource)](gold-sources.md) - The protobuf EGoldSource enum values used in per-player gold_sources stats, including Sinner's Sacrifice and breakables.
* [Playable hero roster](hero-roster.md) - The current playable heroes from /v1/assets/heroes, the list v1 must model.
* [Valve match files and the Steam cache](valve-match-files-and-steam-cache.md) - How match IDs and salts sit in Steam's httpcache, how Valve serves match files from them, and why a cache upload can't give full history (local experiment, 2026-10-08, scrapped).
* [Primary test account](test-account.md) - The user's own Deadlock account, used as the main development and test case.
* [The Cursed Apple map after City Never Sleeps](cursed-apple-map.md) - Layout, lane stops, bridges, objectives and look of Deadlock's map after the City Never Sleeps update, as reference for the M3 low-poly city.
* [Client IP behind Render's proxy](render-client-ip.md) - Which header carries the real visitor address on Render (x-forwarded-for, first entry), and the spoofing caveat that applies to it.
