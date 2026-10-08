---
type: Open Question
title: "Which model should the reviewer agent use?"
description: "Whether the reviewer should move from Opus to Sonnet at high effort for normal code, keeping Opus only for xhigh work."
tags: [process, agents, models, tokens]
status: draft
question_status: open
recommendation: "Sonnet at high effort for normal code, Opus only for xhigh work (auth, data integrity, migrations, security). Owner to decide."
raised_on: 2026-10-08
generated: { by: claude-code/claude-sonnet-5-5, at: 2026-10-08T14:00:00Z }
---

# Context

[ADR 0049](../decisions/0049-agent-model-assignment.md) kept the reviewer on Opus because it is the quality gate. In M2 the reviewer used about 15% of usage. [ADR 0057](../decisions/0057-token-efficient-unattended-runs.md) lowers its default effort to `medium` but does not change its model.

# Options

| Option | Effect |
|---|---|
| Keep Opus for all reviews | Highest rigour; highest cost. |
| Sonnet at `high` for normal code, Opus only for `xhigh` work | Cheaper for most PRs; Opus stays where a miss is expensive. Recommended. |
| Sonnet everywhere | Cheapest; riskiest for auth, data and migrations. |

# Status

Open. The owner decides. If accepted, write a new ADR superseding the reviewer row of ADR 0049 and set `model:` per review (the orchestrator can override the model when it dispatches the agent).
