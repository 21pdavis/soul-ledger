---
type: Open Question
title: "How to handle incomplete match history"
description: How to present and improve the API's partial match-history coverage.
tags: [data, ux]
status: draft
question_status: open
recommendation: "Now: a 'based on N matches' line and a refresh button. Later: a bot-friend 'unlock full history' flow."
raised_on: 2026-10-06
generated: { by: claude-code/claude-opus-5-5, at: 2026-10-07T00:35:00Z }
---

# Problem

`/v1/players/{account_id}/match-history` only returns stored history unless the account friends the API's Steam bot. One sample player had 63 matches going back to 2024-09. See [API](../research/deadlock-api.md).

# Recommendation

- **Now:** show "based on N matches" and a **refresh** button.
- **Later:** a guided "unlock full history" flow in which the player friends the API's Steam bot.
