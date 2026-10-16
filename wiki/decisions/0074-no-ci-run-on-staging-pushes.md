---
type: Decision Record
title: "0074: No CI run on pushes to staging"
description: "CI no longer runs when staging changes, because every change arrives by an up-to-date PR whose run already tested the same code; a newer commit on a PR cancels its older run."
tags: [process, ci]
status: stable
decision: accepted
decided_on: 2026-10-16
generated: { by: claude-code/claude-opus-5-5, at: 2026-10-16T06:00:00Z }
---

Amends the "Pushes to `staging`" row of [ADR 0063](0063-two-depth-ci.md).

# Context

The owner noticed six checks on the staging to main PR (#97): three from the PR run and three from the run on the latest push to staging, on the same commit (2026-10-16). Every merge into staging also started a run that repeated the PR's own.

# Decision

| Topic | Decision |
|---|---|
| Pushes to `staging` | No CI run. PR runs and pushes to `main` are unchanged |
| Superseded runs | A new commit on a PR cancels that PR's run still in progress. Runs on `main` always finish |

# Why no coverage is lost

- Changes reach `staging` only through PRs: the repository rules block direct and force pushes.
- Those rules require a PR to be up to date with `staging` and to pass `checks`, `e2e (desktop)` and `e2e (phone)` before it merges. So the PR run has already tested exactly what `staging` becomes.
- The staging to main PR still runs the full suite before anything goes live, and QA still tests the live staging site.

# Consequences

- A change made to `staging` outside a PR, such as "Update branch" on a staging to main PR, gets no run of its own. That PR's full run still tests it before it reaches `main`.
