---
type: Decision Record
title: "0047: Streamlined review and CI: re-review only for blocking findings, one CI run per change, docs-only fast path"
description: Re-reviews happen only after blocking findings or substantial fixes; each review round's fixes go in one commit; CI runs once per change and skips tests for docs-only PRs; reviewer effort scales with the change.
tags: [process, ci, review]
status: stable
decision: accepted
decided_on: 2026-10-07
generated: { by: claude-code/claude-opus-5-5, at: 2026-10-07T08:00:00Z }
---

# Decision

Refines [ADR 0044](0044-pr-gated-changes-and-agent-review.md) to cut wasted review and CI runs. The owner asked for this after PRs #17–#19 went through repeated review passes and duplicate CI runs.

| Concern | Rule |
|---|---|
| **Re-review** | Only when the review had a **blocking** finding, or the fixes were substantial (new logic, not just wording). If only non-blocking findings and nits remain: fix them, reply on the PR, wait for CI and merge. No further review pass. |
| **Fix batching** | All findings from one review round are fixed in **one commit** and **one push**, with one PR reply and one CI wait. Rule changes the owner raises mid-PR are batched the same way where possible. |
| **CI triggers** | `pull_request`, plus `push` to `main` and `staging` only. Before this, every commit ran twice (push and PR). |
| **Docs-only fast path** | A PR that changes only `*.md`, `wiki/**` or `.claude/**` runs format, lint and the wiki check, and skips typecheck, unit/integration tests and e2e (which includes the production build, since `pnpm test:e2e` builds first). Any other file, including `.github/` and `package.json`, runs everything. So do pushes to `main` and `staging`. |
| **Reviewer effort** | Scales with the change. `medium` for docs or config only, `high` (the agent file's default) for code, `xhigh` for risky code: auth, data integrity, migrations, security. The orchestrator sets the effort when it spawns the reviewer. |

# Why

Each review pass is a separate agent run of roughly 55–90k tokens, and each CI run takes about 3 minutes. Most of the repetition came from:
- re-reviewing rounds that held only nits;
- running every commit twice;
- running the full suite, including e2e, on markdown-only changes.
