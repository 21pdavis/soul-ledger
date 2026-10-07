---
type: Decision Record
title: "0033: Neon project soul-ledger with main and dev branches"
description: Postgres is the Neon project soul-ledger (aws-us-west-2, PG 17) with a main branch for production and a dev branch; tests use throwaway databases.
tags: [backend, infra]
status: stable
decision: accepted
decided_on: 2026-10-06
generated: { by: claude-code/claude-opus-5-5, at: 2026-10-07T01:30:00Z }
---

# Decision

- **Project:** Neon project **soul-ledger**, id `icy-bread-38573768`, in region `aws-us-west-2` (next to Render's Oregon region), running Postgres 17. The database is `soul_ledger`.
- **Branches:** `main` for production and `dev` (`br-fragrant-mud-akcyydom`) for development.
- **Tests** use throwaway databases (local Postgres or ephemeral Neon branches) and never touch `main` or `dev` data.
- Connection strings live only in `.env.local` and Render secrets, **never in the repo**.
