---
type: Decision Record
title: "0039: Deploy from main via a Render Blueprint on the free plan"
description: The app deploys as one free-plan Render web service in Oregon, defined in render.yaml, built from main after PR review, using the migrated Neon main branch.
tags: [hosting, infra, deploy]
status: stable
decision: accepted
decided_on: 2026-10-06
generated: { by: claude-code/claude-opus-5-5, at: 2026-10-07T06:30:00Z }
---

# Decision

| Concern | Choice |
|---|---|
| Definition | `render.yaml` Blueprint in the repo |
| Service | One `web` service, `soul-ledger`, Node 24, region **oregon** (next to Neon `aws-us-west-2`) |
| Plan | **Free** for now. It sleeps after about 15 min idle, so the first visit after a sleep is slow. Move to Starter when real users arrive. |
| Source | Deploys from **`main`**. Changes land through reviewed PRs. |
| Database | Neon **`main`** branch ([ADR 0033](0033-neon-project.md)), migrated 2026-10-06. Render gets `DATABASE_URL` as a Dashboard secret, never committed. |
| Health check | `GET /api/health`. It doesn't touch the database, so a Neon cold start can't fail it. |

# Notes

- The build runs the pnpm version pinned in `package.json` through `npx`, because a global `npm install -g` fails on Render (read-only `/usr/lib/node_modules`). The start command runs `next start` directly.
- Migrations are run by hand (`pnpm db:migrate` with main's `DATABASE_URL`) before merging a PR that changes the schema.

Implements [ADR 0005](0005-stack.md).
