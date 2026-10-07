---
type: Decision Record
title: "0034: Tooling is pnpm, Vitest, Playwright, Drizzle, ESLint and Prettier"
description: Package manager pnpm; Vitest for unit/integration tests; Playwright for e2e on phone and desktop; Drizzle ORM; ESLint and Prettier.
tags: [tooling]
status: stable
decision: accepted
decided_on: 2026-10-06
generated: { by: claude-code/claude-opus-5-5, at: 2026-10-07T01:30:00Z }
---

# Decision

| Concern | Choice |
|---|---|
| Package manager | pnpm |
| Unit and integration tests | Vitest |
| End-to-end tests | Playwright, with phone and desktop projects |
| Database access and migrations | Drizzle ORM (lighter than Prisma and works well with Neon) |
| Linting and formatting | ESLint and Prettier |

These were proposed as defaults, and the user did not object.
