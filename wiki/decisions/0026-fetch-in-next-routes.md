---
type: Decision Record
title: "0026: Fetch inside Next.js server routes with a Postgres job table"
description: API fetching runs in Next.js server routes, coordinated by a Postgres job table/lock, streaming progress to the loading screen.
tags: [backend]
status: stable
decision: accepted
decided_on: 2026-10-06
generated: { by: claude-code/claude-opus-5-5, at: 2026-10-06T16:00:00Z }
---

# Decision

- Fetching runs in **Next.js server routes**.
- A **Postgres job table and lock** deduplicates concurrent lookups of the same player.
- Progress streams to the client to drive the [staged loading](0014-staged-loading.md).
- A separate Render background worker comes later, only if traffic requires it.
