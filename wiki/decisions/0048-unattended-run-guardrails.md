---
type: Decision Record
title: "0048: Hard limits in .claude/settings.json and an escalation procedure for unattended runs"
description: Claude Code permission rules deny pushes to main/staging, force-pushes, destructive Neon actions, Render env changes and reading .env files, while routine commands are pre-allowed; blocked runs commit their work, write up options and send a push notification.
tags: [process, security, agents]
status: stable
decision: accepted
decided_on: 2026-10-07
generated: { by: claude-code/claude-opus-5-5, at: 2026-10-07T08:30:00Z }
---

# Decision

The owner approved two of the six readiness steps for unattended milestone runs: step 3 (standing permissions with hard limits) and step 5 (an escalation rule).

## Hard limits: `.claude/settings.json`

| List | Contents |
|---|---|
| **deny** | The common forms of push to `main`/`staging` (direct, `HEAD:`, `refs/heads/`, refspecs, `--all`, `--mirror`, `git -C`, and a bare `git push`); force-push (`-f`, `--force`, `+refspec`); remote branch deletion; `gh pr merge --admin`; `gh api` ref updates; `gh repo delete/edit`; reading `.env.local` with Read, `cat`, `head`, `tail`, `less` or PowerShell; destructive Neon tools (delete or reset branches, projects, databases, roles, endpoints, snapshots; restore snapshots; apply migrations to main; rotate or revoke credentials; change the default branch); Render environment-variable updates and service creation |
| **allow** | `pnpm`, `npx --yes pnpm@…`, everyday `git` subcommands including `git push` (feature branches; the deny list catches the rest), `gh pr/run/issue/label`, read-only Render tools |
| **ask** | Neon `run_sql`, `run_sql_transaction`, `get_connection_string`, branch and endpoint updates, and storage, auth, function, trigger and data-API deletions; Render `trigger_deploy` |

- Deny rules beat allow rules and apply to every session and subagent, whatever the permission mode.
- **Verified:** `git push origin staging --dry-run` was refused by the permission system, and the denied Neon and Render tools were removed from the session.
- **Limit:** these rules match patterns, so an unusually phrased command could slip through. GitHub branch protection ([#10](https://github.com/21pdavis/soul-ledger/issues/10)) is the backstop. It needs a public repo (at M2) or GitHub Pro.

## Escalation

When blocked, the orchestrator:
1. commits and pushes work in progress to the feature branch;
2. writes the blocker up (what was tried, the error or decision needed, 2–3 options with a recommendation);
3. sends a push notification;
4. continues with independent tasks, or stops if none remain.

"Blocked" means:
- the same failure after about 3 genuinely different attempts;
- a product or business decision that the plan and ADRs don't answer;
- an action denied by the hard limits;
- an external service outage.

The operational wording is in CLAUDE.md, "Unattended runs".

Builds on [ADR 0044](0044-pr-gated-changes-and-agent-review.md) and [ADR 0047](0047-streamlined-review-and-ci.md).
