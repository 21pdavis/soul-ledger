---
type: Decision Record
title: "0083: One reviewer per PR talks directly with its implementer, within hard limits"
description: "Each PR has one implementer and one reviewer that message each other directly through the review and fix rounds, with the orchestrator stepping in only to merge or unblock; message size, rounds and context compactions are capped."
tags: [process, agents, review, tokens]
status: stable
decision: accepted
decided_on: 2026-11-12
generated: { by: claude-code/claude-opus-5-5, at: 2026-11-12T11:00:00Z }
---

# Context

[ADR 0082](0082-fewer-longer-lived-agents.md) keeps one implementer and one reviewer on each PR, but every hand-off between them still went through the orchestrator (Opus), which was woken for each review, each fix and each re-review. The owner asked for a direct conversation between the single reviewer and the single implementer of a PR, with safeguards against context ballooning and against agents being compacted many times.

# Decision

## The pair

- Each PR has exactly **one implementer and one reviewer** for its whole life. Review effort and model rules are unchanged ([ADR 0057](0057-token-efficient-unattended-runs.md) d).
- Both agents have `SendMessage`. The orchestrator gives the reviewer the implementer's agent id in the review brief.

## How the agents stay available

A subagent's turn ends when it hands back, but a `SendMessage` to a finished agent resumes it with its transcript. So each agent ends its turn while waiting, and the other's message wakes it:

- After messaging the implementer, the reviewer ends its turn with a one-line `AWAITING FIXES` report, which the orchestrator ignores.
- After messaging the reviewer, the implementer ends its turn the same way.
- The reviewer records final approval as an approving review comment on the PR, then reports `APPROVED` to the orchestrator.

## The conversation

1. The implementer opens the PR and reports to the orchestrator, which starts the reviewer.
2. The reviewer posts its review on GitHub as before. With no findings it approves at once (step 5) and doesn't message the implementer. Otherwise it sends the implementer **only the review link and the verdict**.
3. The implementer fixes every finding in one commit, replies on each thread, and sends the reviewer **only the new commit and a one-line summary**.
4. The reviewer re-reviews that commit only if the review had a blocking finding or the fixes were substantial ([ADR 0047](0047-streamlined-review-and-ci.md)). Otherwise it approves.
5. When the reviewer approves, it reports to the orchestrator, which waits for CI, merges and tells the owner.

The GitHub threads stay the record of the conversation. Messages between agents carry links and commit ids, never pasted diffs, logs or review text.

## Hard limits

| Limit | Rule |
|---|---|
| Fix rounds | At most **2** per PR (as ADR 0057 h). A third round stops the pair and goes to the orchestrator to re-plan or ask the owner. |
| Message size | At most about **100 words** between agents; at most 150 words to the orchestrator. |
| Context compaction | An agent that has been compacted **4 times** stops at once: it writes a short handoff on the PR (what is done, what is left) and reports to the orchestrator, which starts a fresh agent from that note. After the **2nd** compaction it should already be finishing, not starting new work. |
| Context size | An agent nearing about **150k tokens** of context hands off the same way instead of carrying on. |
| Disagreement | If the implementer disputes a blocking finding, it replies on the thread and messages the reviewer once. If they still disagree, both stop and the orchestrator decides, or asks the owner when it is a business decision. |
| Owner-only matters | Business decisions, owner look sign-off, merges and anything outside the PR always go to the orchestrator. |

## Fallback

If a direct message fails (the other agent is gone or unreachable), the sender reports to the orchestrator, which relays or starts a replacement.

# Consequences

- The orchestrator is woken about twice per PR (PR opened, PR approved) instead of four to six times.
- A short conversation keeps both agents' context small; the compaction and size caps stop a long one from growing without bound.
