---
type: Decision Record
title: "0058: Contact the deadlock-api maintainers, and never work around their rate limits"
description: Outreach to the deadlock-api maintainers moves from deferred to planned, and Soul Ledger will not rotate IPs or otherwise evade per-IP limits; self-hosting a clone of the API is rejected.
tags: [data, api, rate-limits, process]
status: stable
decision: accepted
decided_on: 2026-10-08
generated: { by: claude-code/claude-sonnet-5-5, at: 2026-10-08T15:00:00Z }
---

# Context

Two questions came up on 2026-10-08.

- **Could we run our own version of the API** to escape the partial-history problem? No. Full history needs Valve's game coordinator, an authenticated Steam account that can see the player, and per-match salts. A clone would need its own bot pool, and each player would still have to friend a bot. See [full-history unlock](../open-questions/full-history-unlock.md).
- **Do per-IP rate limits threaten the site as it grows?** Possibly. Bulk metadata allows 30 req/min per IP, and a 650-match player costs about 7 requests. That is roughly 200 to 250 cold lookups an hour from one server IP. Cached and returning players cost almost nothing. A viral burst of first-time visitors, or squad mode (one cold lookup per member), is the risk. Details in [deadlock-api](../research/deadlock-api.md).

# Decision

1. **Approach the maintainers** (Discord or GitHub) before launch. This reverses the deferral in [ADR 0017](0017-full-history-via-patreon-for-now.md). Ask:
   - how third-party sites should guide users through the bot-friend flow;
   - whether an API key, sponsorship or a higher limit is available (the OpenAPI spec lists a separate "Key" rate-limit tier, see [deadlock-api](../research/deadlock-api.md); how to get a key is undocumented);
   - whether the data lake at `data.deadlock-api.com` may be used for bulk reads, and how fresh it is.
2. **Do not circumvent rate limits.** No IP rotation, extra outbound IPs to multiply a quota, or other evasion of per-IP limits. It is bad faith toward a small open-source project, and being blocked would be worse than being slow.
3. **Do not self-host a clone of the API.** It cannot fix the coverage gap and is too costly for the cheap-site goal of [ADR 0001](0001-public-site-postgres-cache.md).
4. **Degrade gracefully instead.** Queue cold lookups server-side, show queue position and an estimated wait, and pre-warm popular accounts off-peak. These are on the [backlog](../recommendations/backlog.md).

# Consequences

- Outreach should wait until there is something to show (a working staging link and real usage numbers), but it is no longer "after the site is off the ground". Drafting the message is a backlog item.
- Any agent suggesting IP rotation or similar workarounds should be pointed at this ADR.
