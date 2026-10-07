---
type: Decision Record
title: "0045: Lighter wiki upkeep: CI checks the bookkeeping, the log records only what matters"
description: The OKF wiki stays, but pnpm check:wiki enforces its structure in CI and log.md records only decisions, research, new concepts, deprecations and milestones.
tags: [process, wiki, okf]
status: stable
decision: accepted
decided_on: 2026-10-07
generated: { by: claude-code/claude-opus-5-5, at: 2026-10-07T07:30:00Z }
---

# Decision

The owner asked for the wiki to be lightened "but not at the cost of helpful context that will be useful for future sessions".

| Concern | Choice |
|---|---|
| Content | Unchanged: ADRs, research, open questions, backlog. Nothing removed. |
| Bookkeeping | `pnpm check:wiki` (`scripts/wiki-check.ts`) runs in CI and checks: frontmatter parses and has `type` and `description`; every concept is in its directory index with a matching description; relative links resolve; supersession and resolution targets exist; log dates are real, ISO and newest first; no CRLF. Agents no longer have to remember any of this. |
| Log | Only `**Decision**`, `**Research**`, `**Creation**`, `**Deprecation**` and `**Milestone**` entries. Routine edits are left to git history. |
| `generated.at` | Bump it for meaningful content changes only, not for description syncs or formatting. |
| Duplication | CLAUDE.md states operational rules briefly and links to the ADR; the ADR holds the reasoning. |

# Why

- OKF v0.2 only *requires* parseable frontmatter with `type`. Most of the overhead was our own manual bookkeeping, and it caused slips such as stale timestamps, CRLF files and drifted index text.
- The first run of the checker found three pages whose YAML frontmatter didn't parse at all. That breaks OKF conformance, and nobody had noticed.
- The wiki's value is in cold starts by future sessions and subagents, so the content stays and only the chores are automated.
