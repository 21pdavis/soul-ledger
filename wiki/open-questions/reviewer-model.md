---
type: Open Question
title: "Which model should the reviewer agent use?"
description: "Resolved by ADR 0057: the reviewer runs on Sonnet at high effort, with Opus only for xhigh work (auth, data integrity, migrations, security)."
tags: [process, agents, models, tokens]
status: stable
question_status: resolved
resolved_by: ../decisions/0057-token-efficient-unattended-runs.md
recommendation: "Sonnet at high effort for normal code, Opus only for xhigh work (auth, data integrity, migrations, security). Accepted by the owner on 2026-10-08."
raised_on: 2026-10-08
generated: { by: claude-code/claude-sonnet-5-5, at: 2026-10-08T15:00:00Z }
---

# Context

[ADR 0049](../decisions/0049-agent-model-assignment.md) kept the reviewer on Opus because it is the quality gate. In M2 the reviewer used about 15% of usage.

# Resolution

The owner decided on 2026-10-08: "sonnet high reviewer with opus for security is perfectly reasonable". Recorded in [ADR 0057](../decisions/0057-token-efficient-unattended-runs.md) (policy d), which amends the reviewer row of ADR 0049:

| Review | Model and effort |
|---|---|
| Docs or config only | Sonnet, medium |
| Code | Sonnet, high |
| Auth, data integrity, migrations, security | Opus, xhigh (the orchestrator passes the Agent tool's `model: "opus"` override) |
