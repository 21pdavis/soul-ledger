---
type: Decision Record
title: "0059: Claude posts as a GitHub App bot"
description: Reviewer and QA agents post PR comments and issues as the "Soul Ledger Claude" GitHub App through pnpm bot:gh, so they no longer appear as the owner.
tags: [process, agents, github, security]
status: stable
decision: accepted
decided_on: 2026-10-08
generated: { by: claude-code/claude-sonnet-5-5, at: 2026-10-08T18:45:00Z }
---

# Context

Agent review comments and QA issues were posted through the owner's `gh` login, so they looked like the owner's own words ([ADR 0044](0044-pr-gated-changes-and-agent-review.md)).

# Decision

1. **A GitHub App, "Soul Ledger Claude"** (app id 5240783, installation id 169337374; neither is secret) is the identity for agent comments and issues.
2. **Permissions:** pull requests read/write, issues read/write, contents **read-only**, checks read, actions read. With contents read-only the bot cannot push or merge, which keeps the hard limits of [ADR 0048](0048-unattended-run-guardrails.md) intact.
3. **Short-lived tokens.** `pnpm bot:gh <gh args>` ([`scripts/bot-gh.ts`](../../scripts/bot-gh.ts)) signs an RS256 app JWT, exchanges it for a one-hour installation token, and runs `gh` with it as `GH_TOKEN`. The token is never printed. If the bot cannot authenticate, the command fails with a one-line message and does **not** fall back to the owner's identity.
4. **Key outside the repo.** The private key lives at a path named by `CLAUDE_BOT_KEY_PATH`, with `CLAUDE_BOT_APP_ID` and `CLAUDE_BOT_INSTALLATION_ID`. They come from the environment, or on Windows from the user registry (`HKCU\Environment`) when the process environment is empty. Environment wins.
5. **Agents:** `reviewer` and `qa` post with `pnpm bot:gh pr comment` / `pnpm bot:gh issue create` and start each comment with **Claude reviewer agent** / **Claude QA agent**.
6. **Scope (owner, 2026-10-08):** the bot is used for review and QA output only. Everything else stays under the owner's name so the owner gets the credit for the work: PRs, implementers' replies, the orchestrator's comments, merges and pushed commits. Implementers and the orchestrator therefore use plain `gh`/`git` and never `pnpm bot:gh`.
7. **Key protection (owner approved 2026-10-08):** `.claude/settings.json` denies the file-reading tool on any `.pem` file (`Read(~/.claude/*.pem)` and `Read(//**/*.pem)`, the owner chose to cover the whole machine), and Bash/PowerShell commands that mention `soul-ledger-bot.pem` or `CLAUDE_BOT_KEY_PATH`. They do not affect `bot:gh`'s own read. The original download of the key was deleted by the owner, leaving one copy. **Known gaps:** these are pattern rules, so a shell wildcard (`*.pem`), `grep -r`, or a script an agent writes could still read the file, and any agent can still run `pnpm bot:gh`, including to post a comment imitating a review. The app's narrow permissions (contents read-only: it can comment but not push or merge) remain the real backstop. If the key is ever exposed, revoke it in the App's settings and generate a new one.

# Open item

Whether an Approve review from the bot counts toward required reviews. Test once branch protection (#10) exists.
