---
type: Backlog
title: Tech-debt register
description: Known shortcuts, gaps and security hardening still to do, each with priority, a fix and its GitHub issue.
tags: [tech-debt, security, infra]
status: stable
generated: { by: claude-code/claude-opus-5-5, at: 2026-10-07T05:30:00Z }
---

Known gaps we accepted to move fast. Each item has a GitHub issue with the `tech-debt` label. Add new items here, with the next free TD number, whenever a shortcut is taken. When one is paid off, mark it done here and close its issue.

**Before the repo goes public at M2** ([ADR 0032](../decisions/0032-github-private-ci.md)), every item tagged *pre-public* must be fixed. Issues and this page become public with the repo.

# Open

| ID | Item | Risk | Fix | Priority | Issue |
|---|---|---|---|---|---|
| TD-1 | `/api/lookup` has no per-client rate limit | Scripted lookups can fill Postgres and spend our deadlock-api quota until we're throttled | Per-IP limit with `429` and `Retry-After`, using the forwarded client IP. Store counts in Postgres or Key Value if we ever scale out. | P1 | [#7](https://github.com/21pdavis/soul-ledger/issues/7) |
| TD-2 | Neon `main`, `staging` and `dev` share one role and password, because branches inherit roles | Local and agent credentials also open production | Reset the production role's password on `main` only, then update the production Render secret | **P0, pre-public** | [#8](https://github.com/21pdavis/soul-ledger/issues/8) |
| TD-3 | The production app connects as the database owner | A bug or compromise could drop or alter tables | A least-privilege app role (row read/write only); the owner role only for migrations | **P1, pre-public** | [#9](https://github.com/21pdavis/soul-ledger/issues/9) |
| TD-4 | The staging URL is reachable from the internet, with sign-in done by our own code ([ADR 0042](../decisions/0042-staging-environment.md)) | A bug in the gate would expose staging | Cloudflare Access on a custom domain (free up to 50 users) and the onrender.com subdomain disabled | P2 | [#11](https://github.com/21pdavis/soul-ledger/issues/11) |
| TD-5 | `main` is not branch-protected | A direct push would deploy production without CI | Require a PR plus green CI, and no force-push, once the repo is public (free then) | P1, at M2 | [#10](https://github.com/21pdavis/soul-ledger/issues/10) |
| TD-6 | 2FA on the GitHub, Render, Neon and Google accounts is unconfirmed | Account takeover equals full control | The owner turns on 2FA everywhere. This is a personal task, so it has no issue. | P0 | n/a |
| TD-7 | CI actions target the deprecated Node 20 runtime | CI breaks when GitHub removes Node 20 | Bump the action versions | P2 | [#12](https://github.com/21pdavis/soul-ledger/issues/12) |
| TD-8 | The Steam ResolveVanityURL test fixtures are synthetic, not recorded ([research](../research/steam-vanity-resolution.md)) | Tests could pass against the wrong response shape | Re-record them with the real key | P3 | [#13](https://github.com/21pdavis/soul-ledger/issues/13) |
| TD-9 | deadlock-api rate limiting happens in memory, per process | Several instances would together exceed the per-IP limits | Use a shared limiter if we ever run more than one instance | P3 | (none until we scale) |

# Done

None yet.
