---
type: Decision Record
title: "0082: Fewer, longer-lived agents: one implementer owns a PR to merge"
description: "A milestone runs about 3 to 4 PRs and about 10 agents; the implementer that opens a PR stays on it through review fixes, the reviewer that reviewed it does the re-review, and the orchestrator fixes up to about 50 lines itself; reviews stay as thorough as before."
tags: [process, agents, tokens, cost]
status: stable
decision: accepted
decided_on: 2026-11-12
generated: { by: claude-code/claude-opus-5-5, at: 2026-11-12T10:00:00Z }
---

# Context

M4 (0.4.0) used most of a 5-hour usage window. It ran 11 PRs and about 30 agents: the orchestrator split the plan into 8 PRs, QA found 2 more bugs, and nearly every PR went build, review, then a fresh fix agent, then often a fresh re-reviewer. Fix agents alone used 40k to 100k tokens each, mostly re-reading CLAUDE.md, the ADRs and the code the original implementer already knew. The orchestrator (Opus) was also woken about 60 times, many of them by repeat review-comment events. The owner called 30 agents far too many, asked to keep reviews thorough, and asked to keep implementers alive while their PR is reviewed.

# Decision

Reviews are unchanged: same reviewer, model and effort rules ([ADR 0057](0057-token-efficient-unattended-runs.md) d, [ADR 0047](0047-streamlined-review-and-ci.md), [ADR 0072](0072-concise-reviews-one-thread-per-finding.md)). What changes is how many agents run and how long they live.

| Topic | Rule |
|---|---|
| PRs per milestone | About **3 to 4**, each a coherent slice (for example backend, pictures and preview, page and button). Split further only when one implementer genuinely can't hold the slice. |
| Agent budget | About **10 agents per milestone** in total (implementers, reviewers, QA, wiki). Going past it means the plan was too fine: the orchestrator says so and re-plans. |
| Implementer lifetime | The implementer that opens a PR **owns it until merge**. After the review, the orchestrator sends it the review link with `SendMessage`, and it fixes everything in one commit, replies on the threads and stops. No fresh fix agents. Send it promptly (within about an hour), while its context is still cached. |
| Re-review | Goes to the **same reviewer** agent via `SendMessage`, so it doesn't re-read the PR from scratch. |
| Orchestrator fixes | The orchestrator fixes findings itself when the whole round is about **50 lines or fewer** (was 20). |
| QA findings | Bugs QA finds before a release are fixed in **one** PR, by one implementer. |
| Visual sign-off | One batch of screenshots per visual PR, after the review fixes, not before. |
| Repeat events | A CI-monitor event that repeats review comments already fixed gets a one-line acknowledgement, with no new work. |

The 2-fix-round limit, short hand-backs and targeted tests from ADR 0057 still apply.

# Consequences

- A resumed agent reloads its transcript; that is cheaper than a cold start while the cache is warm, and a cold start is still used if the original agent is gone or its context is over about 150k.
- Bigger PRs mean longer reviews, but far fewer of them, and the review rules are unchanged.

# Supersedes in part

[ADR 0057](0057-token-efficient-unattended-runs.md) section b ("do not resume an agent for a small fix; use a fresh agent") and the 20-line orchestrator limit.
