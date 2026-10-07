---
type: Decision Record
title: "0043: Staging access by secret link and 90-day cookie, replacing Google sign-in"
description: The staging gate admits a browser that opened a link carrying STAGING_ACCESS_KEY (then a signed 90-day cookie) or a request with that key in the x-staging-token header; Google sign-in is dropped.
tags: [infra, staging, auth]
status: stable
decision: accepted
decided_on: 2026-10-07
generated: { by: claude-code/claude-opus-5-5, at: 2026-10-07T06:00:00Z }
---

# Decision

The environments, branches and agent rules of [ADR 0042](0042-staging-environment.md) stand. Only **how staging is unlocked** changes. The user preferred something simpler than Google sign-in.

| Concern | Choice |
|---|---|
| Secret | One `STAGING_ACCESS_KEY` of at least 32 random characters, set only on the staging service |
| Browsers | Open any staging URL with `?key=<key>` once. The proxy sets a **signed, HttpOnly, Secure, SameSite=Lax cookie lasting 90 days**, then redirects to the same URL without the key. |
| Cookie | `<expiry>.<HMAC-SHA256(key, expiry)>`, so it never contains the key. Changing the key logs every browser out. |
| Automation | The same key in the `x-staging-token` header, used by `pnpm test:e2e:staging` and agents |
| Refusals | Pages get a plain `401` "This staging site is private" page; API calls get `401` JSON. Everything is sent with `X-Robots-Tag: noindex, nofollow`. |
| Always open | `/api/health`, for Render's health check |
| Fail closed | If the gate is on but the key is missing or shorter than 32 characters, **everyone** is refused |
| Production | Gate off. The proxy passes everything through and ignores `?key=`. |

All checks compare in constant time. The code is in `src/lib/staging-gate.ts` and `src/proxy.ts`.

# Trade-offs

- **The link is the password.** Anyone who has it gets in, and it stays in browser history on devices where it was opened. Keep it in a password manager and don't paste it anywhere public. If it leaks, change `STAGING_ACCESS_KEY` on Render, which also logs everyone out.
- Unlike Google sign-in, access isn't tied to a person, there's no second factor, and there's no per-person revocation. That's acceptable for one owner reviewing a staging site with public data.
- The URL is still reachable from the internet; only the app's gate stands in front. The upgrade path stays Cloudflare Access on a custom domain ([#11](https://github.com/21pdavis/soul-ledger/issues/11)).

Supersedes the Google sign-in part of [ADR 0042](0042-staging-environment.md).
