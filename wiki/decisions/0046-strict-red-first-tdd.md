---
type: Decision Record
title: "0046: Strict red-first TDD on every behaviour change"
description: TDD is mandatory, not "where possible" - every behaviour change is red, green, refactor with the failing test run and seen failing first, and PRs show the evidence.
tags: [testing, process]
status: stable
decision: accepted
decided_on: 2026-10-07
generated: { by: claude-code/claude-opus-5-5, at: 2026-10-07T07:30:00Z }
---

# Decision

This strengthens [ADR 0029](0029-testing-tdd.md), which said "test-driven development wherever possible".

- Every behaviour change follows **red → green → refactor**. The test is written first, **run, and seen to fail for the expected reason** before any implementation is written.
- Bug fixes start with a failing regression test.
- Tests are never deleted, skipped or weakened to get green without saying why in the PR.
- PR descriptions list the red → green evidence for each behaviour, and reviewer agents check it ([ADR 0044](0044-pr-gated-changes-and-agent-review.md)).
- **Exceptions**, which need no failing test: docs, config, generated migrations and pure wiring with no logic. They're named in the PR.

The operational wording lives in CLAUDE.md under "Testing: strict TDD".

# Why

When asked, the agent reported that tests had always come first or alongside the code, but in about half the cases nobody watched them fail first. The owner asked for strict TDD to be a rule. An independent review of PR #14 then noted that ADR 0029 was weaker than that rule.
