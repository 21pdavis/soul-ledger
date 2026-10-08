---
type: Decision Record
title: "0049: Agent models: qa moves to Haiku 5.5, the other agents keep their models"
description: "The qa agent runs on Haiku 5.5; implementer and wiki-keeper stay on Sonnet and reviewer stays on Opus."
tags: [process, agents, models]
status: stable
decision: accepted
decided_on: 2026-10-07
generated: { by: claude-code/claude-sonnet-5-5, at: 2026-10-07T09:00:00Z }
---

# Decision

Haiku 5.5 (`haiku` alias) became available. Each agent's `model:` was reviewed against how much judgement its job needs.

| Agent | Model | Why |
|---|---|---|
| `qa` | `haiku` (was `sonnet`) | Mostly procedural: run the e2e suites, take screenshots, read Render logs, file issues in a fixed format. It isn't asked to edit code and is limited by the [ADR 0048](0048-unattended-run-guardrails.md) deny rules. The main risk is its visual judgement of screenshots (layout, overflow, readability, whether desktop looks deliberate); a missed bug shows up in the next run or in the staging to main review by the owner. |
| `wiki-keeper` | `sonnet` (no change) | `pnpm check:wiki` catches the bookkeeping, but deciding what counts as a decision, and writing ADR reasoning without inventing it, is judgement. The wiki is the source of truth, so errors here persist. |
| `implementer` | `sonnet` (no change) | Strict TDD code work. |
| `reviewer` | `opus` (no change) | The quality gate for security, data integrity and migrations ([ADR 0044](0044-pr-gated-changes-and-agent-review.md), [ADR 0047](0047-streamlined-review-and-ci.md)). Not worth saving tokens here. |

# Revisit

If `qa` misses bugs, misses visual regressions on phone or desktop, or files poor issues, move it back to `sonnet`. If `wiki-keeper` runs show mostly mechanical work, try Haiku there.

# Requirements

Haiku 5.5 needs Claude Code v2.1.293 or later. On Bedrock, Vertex, Foundry and Claude Platform on AWS the `haiku` alias points to Haiku 4.5, which doesn't support `effort`; `qa.md` keeps `effort: high` for the Anthropic API.
