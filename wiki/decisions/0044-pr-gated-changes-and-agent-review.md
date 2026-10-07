---
type: Decision Record
title: "0044: PRs gate every change; agent review before merging into staging"
description: Every change goes through a PR with green CI; agents merge into staging only after an independent agent review whose feedback they act on; the owner hears about every merge and alone merges into main.
tags: [process, git, review]
status: stable
decision: accepted
decided_on: 2026-10-07
generated: { by: claude-code/claude-opus-5-5, at: 2026-10-07T07:00:00Z }
---

# Decision

| Rule | Detail |
|---|---|
| **PRs gate every change** | Never push directly to `staging` or `main`, never force-push them, and never push to a branch after its PR has merged. This covers one-line doc fixes too. |
| **Merging into `staging`** | An agent may merge its own PR only when CI passes on the final commit **and** an independent agent review is done. |
| **Agent review** | A separate reviewer agent, not the author, reviews the full diff against the plan, the ADRs and the TDD rule. It posts its findings as a PR comment, even when it finds nothing. |
| **Acting on review feedback** | The author acts on agent feedback right away, as if the owner had said "go fix the feedback on this PR". **Blocking** findings must be fixed, unless they turn on a business decision only the owner can make; then ask the owner and don't merge until they answer. Non-blocking findings and nits are fixed, or answered in a PR reply explaining why not. Every fix commit needs CI again. |
| **`main`** | `staging` → `main` PRs always need the owner, and only the owner merges them. |
| **Merge notifications** | Report every merge to the owner straight away: PR number and link, a one-line summary, the review outcome, and CI. This includes merges an agent notices but didn't make, such as the owner's own. During long unattended runs, also send a push notification. |

# Why

- An agent pushed directly, and force-pushed, to `staging` while setting up staging, and a commit landed after PR #6 had merged. The owner: "PRs must gate any and all code changes."
- PRs into `staging` don't need the owner's review, but some other agent must review them first.
- The owner wants review feedback handled without being asked each time, and wants to hear about every merge.

Enforcement on GitHub (branch protection for `main` and `staging`) is tracked in [#10](https://github.com/21pdavis/soul-ledger/issues/10).

Supersedes the "agents may merge to `staging` once CI is green" rule in [ADR 0042](0042-staging-environment.md).
