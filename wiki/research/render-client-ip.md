---
type: Reference
title: Client IP behind Render's proxy
description: "On Render, Cloudflare sets true-client-ip and cf-connecting-ip to the real visitor address, while the first x-forwarded-for entry is whatever the client sent."
tags: [render, security, rate-limit]
status: stable
generated: { by: claude-code/claude-sonnet-5-5, at: 2026-10-17T13:30:00Z }
stale_after: 2027-01-17T00:00:00Z
sources:
  - id: cf-headers
    resource: https://developers.cloudflare.com/fundamentals/reference/http-headers/
    title: Cloudflare docs, HTTP request headers
  - id: render-ddos
    resource: https://render.com/docs/ddos-protection
    title: Render docs, DDoS protection (Render runs behind Cloudflare)
---

Used by the lookup rate limit ([ADR 0076](../decisions/0076-per-ip-lookup-rate-limit.md)).

* Render serves every web service through Cloudflare and then its own proxy, so the TCP peer is never the visitor.[^render-ddos]
* **Use `true-client-ip` (or `cf-connecting-ip`).** Cloudflare sets both to the visitor's address. A client-sent `true-client-ip` is overwritten, and a request carrying its own `cf-connecting-ip` is refused with Cloudflare error 1000.[^cf-headers] Observed on a Render web service (httpbin.onrender.com) on 2026-10-17.
* **Never trust the first `x-forwarded-for` entry.** Cloudflare appends to a client-sent value instead of replacing it.[^cf-headers] Sending `X-Forwarded-For: 1.2.3.4` to the same service delivered `1.2.3.4,<visitor>, <Cloudflare edge>, <10.x Render proxy>`.

[^cf-headers]: https://developers.cloudflare.com/fundamentals/reference/http-headers/
[^render-ddos]: https://render.com/docs/ddos-protection
