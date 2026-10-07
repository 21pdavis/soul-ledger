---
type: Decision Record
title: "0009: Preview story from stored data, then a second step unlocks full history"
description: v1 renders a preview from whatever history the API already holds, then invites the player to unlock full history.
tags: [data, ux]
status: stable
decision: accepted
decided_on: 2026-10-06
generated: { by: claude-code/claude-opus-5-5, at: 2026-10-06T12:00:00Z }
---

# Decision

1. **Preview:** build the story from the API's stored history, with an honest "based on N matches" line and a refresh button.
2. **Unlock:** ask the player to take a second step to get full history. The user's preferred step is friending the API's Steam bot.

# Open

The exact unlock mechanism is not verified yet. See [unlock full history](../open-questions/full-history-unlock.md).
