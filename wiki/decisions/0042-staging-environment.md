---
type: Decision Record
title: "0042: A private staging environment behind Google sign-in, fed by a staging branch"
description: Staging is a second Render service deploying the staging branch against a Neon staging branch, gated by Google sign-in for allowlisted emails plus a bypass token for automation.
tags: [infra, staging, auth, process]
status: stable
decision: accepted
decided_on: 2026-10-07
generated: { by: claude-code/claude-opus-5-5, at: 2026-10-07T05:00:00Z }
---

# Decision

| Environment | Git branch | URL | Database | Access |
|---|---|---|---|---|
| Production | `main` | soul-ledger.onrender.com | Neon `main` | Public, no login ([ADR 0002](0002-steam-id-no-login.md)) |
| **Staging** | **`staging`** | soul-ledger-staging.onrender.com | Neon **`staging`** (`br-falling-meadow-akqqh857`) | **Google sign-in, allowlisted emails only** |
| Local | any | localhost | Neon `dev` | — |

# Flow

1. Work happens on feature branches cut from `staging`. PRs target `staging`.
2. **Agents may merge to `staging`** once CI is green, then validate on the live staging site.
3. Promotion is a `staging` → `main` PR that **only the owner merges**. That merge deploys production.

# The gate (`src/proxy.ts`, `src/lib/staging-gate.ts`)

- Turned on by `STAGING_GATE=on`, which only the staging service sets. In production the proxy lets everything through, never loads Auth.js, and 404s `/api/auth/*`.
- **Google sign-in** via Auth.js v5 (`next-auth@5.0.0-beta.32`, the line built for the App Router). Only **verified** emails in `STAGING_ALLOWED_EMAILS` can sign in. Sessions are JWT cookies lasting **30 days**.
- **Bypass token** for tests and agents: the `x-staging-token` header must equal `STAGING_BYPASS_TOKEN` (at least 32 characters, compared in constant time).
- Always open: `/api/health` (Render's check) and `/api/auth/*` (the sign-in flow).
- Everything on staging is sent with `X-Robots-Tag: noindex, nofollow`.
- Signed-out pages redirect to sign-in. Signed-out API calls get `401`.

# Why

- The user wants agents to work end to end and then review a live, private build.
- Google sign-in avoids repeated logins, and Google handles the password and 2FA.
- Basic Auth was simpler but means logging in again after each browser restart.
- Cloudflare Access is stronger, because it blocks traffic before it reaches the app, but needs a custom domain. Revisit it if one is bought.

# Notes

- Render's free plan shares 750 instance-hours a month across the workspace, which also holds the voter-info services. Free services sleep when idle.
- Proxy-level auth fits a staging gate. It is not a pattern for real user accounts.
