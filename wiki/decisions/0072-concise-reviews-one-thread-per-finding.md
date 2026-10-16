---
type: Decision Record
title: "0072: Concise agent reviews, one thread per finding"
description: "The reviewer agent posts only problems, one comment per finding with inline suggested changes where possible, and a re-review waits until every thread is resolved or marked blocked (rare)."
tags: [process, review, agents]
status: stable
decision: accepted
decided_on: 2026-10-15
generated: { by: claude-code/claude-opus-5-5, at: 2026-10-15T22:30:00Z }
verified: { by: human:paul, at: 2026-10-15T22:30:00Z }
---

Amends [ADR 0044](0044-pr-gated-changes-and-agent-review.md) and [ADR 0059](0059-claude-posts-as-github-app-bot.md) decision 5: the reviewer now posts a PR review with separate comments, not a single `pr comment`.

# Context

Agent reviews ([ADR 0044](0044-pr-gated-changes-and-agent-review.md), posted as the bot per [ADR 0059](0059-claude-posts-as-github-app-bot.md)) were one long PR comment that restated the PR and listed everything that checked out. The owner found that unnecessary and a waste of tokens (2026-10-15).

# Decision

1. **Problems only.** No summary of what was checked or what was fine; the review body is a single verdict line.
2. **One comment per problem**, each its own thread: inline on the line when possible, with a GitHub suggestion block when the fix is a concrete edit; otherwise a file comment (posted through the PR comments API, since reviews can't carry file comments).
3. **Fixing:** the orchestrator or implementer fixes a round in one commit, replies on each thread and resolves it.
4. **Blocked** threads (a decision only the owner can make) are rare: reply `Blocked: <question>` and leave the thread open.
5. **Re-review** waits until every thread is resolved or blocked. Whether one happens at all still follows [ADR 0047](0047-streamlined-review-and-ci.md): only after a blocking finding or substantial fixes.

# Consequences

- Shorter reviews and fewer tokens; suggestions can be applied in one click.
- Review state is visible per thread on GitHub, so nothing is lost in a long comment.
- Rules live in `.claude/agents/reviewer.md` and CLAUDE.md's review bullets.
