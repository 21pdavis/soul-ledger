---
type: Reference
title: Client IP behind Render's proxy
description: "Which header carries the real visitor address on Render (x-forwarded-for, first entry), and the spoofing caveat that applies to it."
tags: [render, security, rate-limit]
status: draft
generated: { by: claude-code/claude-sonnet-5-5, at: 2026-10-17T12:00:00Z }
stale_after: 2027-01-17T00:00:00Z
sources:
  - id: render-headers
    resource: https://render.com/docs/http-request-headers
    title: Render docs, HTTP request headers
---

Used by the lookup rate limit ([ADR 0075](../decisions/0075-per-ip-lookup-rate-limit.md)).

* Render's proxy sits in front of the app, so the TCP peer is never the visitor. The visitor's address arrives in `x-forwarded-for`, a comma-separated list; the first entry is the original client.[^render-headers]
* **Caveat:** if a client sends its own `x-forwarded-for`, a proxy that appends rather than replaces leaves the client-supplied value first, so the first entry can be forged. The limiter therefore also caps how many addresses it tracks, so forged values cannot exhaust memory, but a determined client could dodge the per-IP count by rotating a fake header.
* **Not verified:** the docs page could not be fetched while writing this, so the header behaviour above is recorded from the owner's brief, not checked against Render. To verify: send `curl -H "x-forwarded-for: 1.2.3.4"` to staging and log what the app sees. If Render replaces the header or offers a trusted one (for example `true-client-ip`), switch `clientIp` in `src/lib/ip-rate-limit.ts` to it.

[^render-headers]: https://render.com/docs/http-request-headers
