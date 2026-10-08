---
type: Decision Record
title: "0057: Token-efficient unattended runs"
description: "Eleven policies that cut token use in agent runs: orchestrator context hygiene, fresh narrow subagents, short briefs and reports, cheaper models and effort (reviewer on Sonnet, Opus for security work), foundation-first and fewer PRs, targeted tests, bounded fix loops, per-milestone measurement, small always-loaded context, and CI watched by the orchestrator."
tags: [process, agents, tokens, cost]
status: stable
decision: accepted
decided_on: 2026-10-08
generated: { by: claude-code/claude-sonnet-5-5, at: 2026-10-08T14:00:00Z }
sources:
  - id: costs
    resource: https://code.claude.com/docs/en/costs
    title: Manage costs effectively (Claude Code docs)
  - id: context
    resource: https://anthropic.com/engineering/effective-context-engineering-for-ai-agents
    title: Effective context engineering for AI agents (Anthropic Engineering)
---

# Context

M2 used about two 5-hour usage windows. `/usage` attributed the spend as: implementer subagents 50%, the long orchestrator session (over 150k context) 60% of its share, reviewer 15%, qa 6%. Cost grows with context size, so the levers are smaller contexts, fewer agent turns and cheaper models where quality allows.[^costs][^context] The owner asked for all of the policies below to be written down.

# Decision

## a. Orchestrator context hygiene

- Write the handoff note (memory) at every phase boundary.
- The agent cannot run `/clear` or `/compact`. It recommends that the **owner** runs `/clear` between phases and milestones.
- Subagent hand-backs to the orchestrator are at most about 150 words. Detail goes in the PR description or review comment, which the orchestrator reads only when needed.
- The orchestrator never pastes an agent's report into its own replies.

## b. Subagent lifecycle

- Use fresh, narrowly scoped agents.
- Do **not** resume an agent for a small fix: resuming reloads its whole transcript. Use a fresh agent given the PR number and a link to the review comment, or fix it in the orchestrator when it is about 20 lines or fewer.
- Resume only when the fix truly needs that agent's accumulated context.

## c. Brief format

- Contents: goal, files or areas, acceptance criteria (link to the plan page) and constraints.
- Do **not** restate CLAUDE.md or the process; agents read CLAUDE.md.
- Pass references (paths, PR and issue numbers), not pasted contents.
- Target 200 to 300 words.

## d. Models and effort

| Agent | Model and effort |
|---|---|
| `implementer` | Sonnet by default, effort `medium`. **Trial** Haiku 5.5 on one well-specified task in M3, record cost and quality in the milestone log, then decide. |
| `reviewer` | **Sonnet** (was Opus; the owner decided on 2026-10-08: "sonnet high reviewer with opus for security is perfectly reasonable"). Effort `high` for code, `medium` for docs or config only. `xhigh` on **Opus** only for auth, data integrity, migrations and security: the orchestrator passes the Agent tool's `model: "opus"` override ([ADR 0047](0047-streamlined-review-and-ci.md)). Re-reviews check only the fixes. This amends the reviewer row of [ADR 0049](0049-agent-model-assignment.md). |
| `qa` | Haiku ([ADR 0049](0049-agent-model-assignment.md)). |
| `wiki-keeper` | Sonnet, effort `medium`. |

## e. Foundation first

Before parallel implementers start, the first PR of a milestone lands the shared primitives: count-up and reveal-type helpers, layout frames that adapt to small stages with container queries, shared formatters, one copy module, and a worst-case fixture plus a small-phone fit test. The plan page lists these shared pieces up front. (M2 found them late: #37, #38, #41.)

## f. Fewer, bigger PRs

Group tightly coupled tasks (for example three related slides) into one PR. Every PR pays a fixed cost: setup, reading ADRs, full checks and a review.

## g. Test cost

- Agents run unit and component tests plus **only the e2e spec files they touched**, locally (targeted Playwright). The full e2e suite is left to CI.
- Keep e2e matrices small: representative sizes, reduced-motion emulation.
- Pipe long command output through filters (`tail`, `grep` for failures). Never read whole logs.

## h. Bounded loops

At most 2 fix rounds per PR. A third round means the orchestrator re-plans or asks the owner instead of looping. Reviewers re-review only after blocking findings ([ADR 0047](0047-streamlined-review-and-ci.md)), and check only the fixes.

## i. Measure

At the end of each milestone the owner shares `/usage` attribution by subagent, and the orchestrator records a short retrospective in `wiki/log.md` (or a recommendations page), compared with the previous milestone. M2 is the baseline (figures above).

## j. Keep always-loaded context small

- CLAUDE.md stays under about 200 lines. Every agent loads it every turn. Move rarely needed detail into skills or ADRs.
- Keep the agent briefs short.
- Prefer CLI tools over MCP servers.
- Keep the cache prefix stable mid-run: avoid editing CLAUDE.md or agent files during a run.
- The prompt cache expires after about an hour idle, so a long pause makes the next turn expensive.[^costs]

## k. CI watching

- Implementers do **not** wait for CI. After pushing they open or update the PR and stop with their short report.
- The orchestrator watches CI with a background shell command (`gh pr checks N --watch` run in the background). It costs no model tokens while waiting and notifies on exit.
- If CI fails, a small fresh Haiku agent reads the failing job log and reports at most 100 words: failing test names, the error line and the likely cause. The fix then goes to a fresh narrowly scoped agent or the orchestrator (policy b).
- Why: a blocked implementer keeps its whole context alive and re-reads it on resume. Waiting is a job for a plain command, and triage is a job for Haiku.

# Alternatives considered

| Option | Why not |
|---|---|
| Agent teams | Roughly 7x the tokens of a single session[^costs]; the opposite of the goal. |
| Rely on auto-compaction only | Compaction is lossy and happens late, after the cost is paid; hygiene up front is cheaper and keeps decisions intact. |
| Do nothing | M2 hit usage limits after about two windows, which would stall M3. |

# Consequences

- Runs get cheaper and longer-lived, at the cost of more process discipline from the orchestrator and the owner (`/clear` between phases, sharing `/usage`).
- Agent briefs and reports get shorter, so reviewers and the owner read PR text for detail.
- Fewer, bigger PRs raise per-PR review size; the foundation-first rule keeps them coherent.
- The Haiku trial is open to evidence from M3 rather than assumed. Reviews on Sonnet are cheaper; if review quality drops, raise effort or use Opus for that PR.
- Follow-ups are in the [backlog](../recommendations/backlog.md).

[^costs]: Manage costs effectively (Claude Code docs)
[^context]: Effective context engineering for AI agents (Anthropic Engineering)
