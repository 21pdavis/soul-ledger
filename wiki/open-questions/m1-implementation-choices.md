---
type: Open Question
title: "M1 implementation choices awaiting confirmation"
description: The libraries, schema and tuning values chosen while building M1; confirmed by ADR 0040.
tags: [m1, tooling, backend, tuning]
status: stable
question_status: resolved
resolved_by: ../decisions/0040-m1-implementation-choices.md
recommendation: "Accept as built; tune the thresholds once real players' stories can be seen in M2."
raised_on: 2026-10-06
generated: { by: claude-code/claude-opus-5-5, at: 2026-10-07T05:30:00Z }
---

These were chosen while building M1 ([ADR 0028](../decisions/0028-milestones.md)) and are in the code. Each is easy to change now and harder later.

# Libraries and infrastructure

| Choice | Why | Alternative |
|---|---|---|
| **PGlite** (Postgres compiled to WASM, in-process) for integration tests | Real Postgres with no Docker or local install, a fresh database per test, and no Neon access in CI. Satisfies "throwaway databases" ([ADR 0033](../decisions/0033-neon-project.md)). | A Postgres service container in CI |
| **node-postgres (`pg`)** driver to Neon's pooler | Render runs a long-lived Node server, and the job lock needs a real connection | `@neondatabase/serverless` |
| **zod** to validate every API response | The API is third-party and changes with patches; failures are explicit | Trust the JSON |
| **No Tailwind** | `create-next-app` added it, but no ADR chose it and M1 has no UI. Removed. | Re-add for M2 |
| **NDJSON stream** from `GET /api/lookup?q=&window=all\|patch&refresh=1` | One event per line drives the staged loading ([ADR 0014](../decisions/0014-staged-loading.md)) | Server-Sent Events |

# Schema

- `player_matches` stores **flattened stat columns** (40), not raw API JSON. That's about 300 bytes per row against about 8 KB raw, and plain columns make Hall of Fame queries simple SQL. The downside: a new stat needs a migration and a backfill.
- Account ids are `bigint`, because they can exceed Postgres `integer`.

# Tunable thresholds (`src/lib/stats/story.ts`, `percentiles.ts`)

The one-trick line is decided: 50% ([ADR 0038](../decisions/0038-one-trick-threshold-50.md)).

| Threshold | Value |
|---|---|
| Parry king if the parry success rate is at least | 50% (the test account is 49%, so "clown") |
| Fewest main-hero matches before ranking against same-hero players | 10 |
| Lookups skip the API if the player was synced within | 5 minutes |
| MVP weights | kills 0.8; deaths, assists 0.9; denies, teammate healing, headshot rate 1.2; accuracy, objective damage 1.1; others 1.0 |
