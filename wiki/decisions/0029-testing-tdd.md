---
type: Decision Record
title: "0029: Comprehensive testing is the cornerstone; TDD where possible"
description: Comprehensive unit and integration tests are the cornerstone of the project, written test-first wherever possible.
tags: [testing, process]
status: stable
decision: accepted
decided_on: 2026-10-06
generated: { by: claude-code/claude-opus-5-5, at: 2026-10-06T16:00:00Z }
---

> **Strengthened** by [ADR 0046](0046-strict-red-first-tdd.md): TDD is mandatory and red-first, not "where possible".

# Decision

- **Comprehensive unit and integration testing is the cornerstone of the project** (user's words).
- Use **test-driven development** wherever possible: write the failing test first.
- **Unit tests** cover all stat calculations, percentile and MVP logic, squad role assignment, and Steam URL parsing. They run against **saved real match fixtures**, including Street Brawl, to prove it is filtered out.
- **Integration tests** cover API client to Postgres cache to computed story, using recorded API responses, plus the job-table dedupe.
- **End-to-end (browser) tests** play through the whole story on phone and desktop viewports.
- The CI pipeline must run all of these.
