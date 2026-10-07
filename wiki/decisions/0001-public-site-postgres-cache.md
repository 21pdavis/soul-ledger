---
type: Decision Record
title: "0001: Public site from day one, cached in our own Postgres"
description: The site is public at launch and every player lookup is cached in our Postgres so each match is fetched from the API only once.
tags: [architecture, caching, cost]
status: stable
decision: accepted
decided_on: 2026-10-06
generated: { by: claude-code/claude-opus-5-5, at: 2026-10-07T00:35:00Z }
---

# Context

The site needs data from the third-party [deadlock-api.com](../research/deadlock-api.md), which is rate-limited per IP (30 req/min for bulk metadata, 200 req/min shared across analytics). A public site has to stay cheap and must not hammer the API.

# Decision

- Launch publicly from day one.
- Persist every fetched match and player lookup in our own Postgres (Neon, see [0005](0005-stack.md)).
- Each player's matches are fetched once. Later visits only fetch matches newer than our cached ones.

# Consequences

- We need a schema for matches and per-player match rows, plus a refresh policy (see [incomplete history](../decisions/0009-preview-then-full-history.md)).
- Postgres storage grows with users. Store only the fields the slides need, or compress raw JSON.
- Our cache also feeds the site-only Hall of Fame (see [ranking population](../decisions/0008-ranking-population.md)).
