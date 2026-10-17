---
type: Decision Record
title: "0075: Per-IP rate limit on /api/lookup, in memory"
description: "Each client IP gets 10 lookups a minute from an in-memory fixed window; over it the server answers 429 with Retry-After, and holders of the staging key are exempt."
tags: [security, api, rate-limit]
status: stable
decision: accepted
decided_on: 2026-10-17
generated: { by: claude-code/claude-sonnet-5-5, at: 2026-10-17T12:00:00Z }
---

Fixes #7. Each lookup can write to Postgres and spends our shared deadlock-api quota, so unlimited scripted lookups could fill the database and get us throttled.

## Decision

* **Limit:** 10 lookups per minute per client IP, a fixed window (`LOOKUP_LIMIT`, `LOOKUP_WINDOW_MS` in `src/lib/ip-rate-limit.ts`). The window starts at an IP's first request and refused requests do not extend it.
* **Over the limit:** HTTP 429, a `Retry-After` header (whole seconds to the end of the window) and the JSON body `{ "error": "rate_limited", "retryAfter": n }`. The check runs before any database or deadlock-api work.
* **Where the count lives:** in this process's memory, which is correct for our single Render instance. Sharing it across instances joins #16 (the shared deadlock-api limiter); no new database table.
* **Client IP:** the first entry of `x-forwarded-for` ([research](../research/render-client-ip.md), with its spoofing caveat). Requests with no address share one `unknown` bucket.
* **Bounded memory:** expired buckets are swept as new ones are added, and at most `MAX_BUCKETS` (10,000) are held; past that the oldest are dropped.
* **Staging e2e:** requests carrying the valid `x-staging-token` are exempt. The key exists only on the gated staging site (ADR 0043) and is compared in constant time, so it cannot be used from production, and the suites need no special limit or reset hook. Production has no exemption.
* **The UI:** the client turns a 429 into an error screen saying "Too many lookups, try again in N seconds." with a Try again button.

## Consequences

* A restart clears the counts, and two instances would each allow the full limit, until #16 is done.
* Several people behind one shared address (a school, a café) share one allowance.
* A client that forges `x-forwarded-for` can dodge the count; see the research page for how to verify and harden.
