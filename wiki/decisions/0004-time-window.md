---
type: Decision Record
title: "0004: All-time by default, with a this-patch toggle"
description: Stats default to the player's all-time history, with a toggle to show only the current patch.
tags: [data, ux]
status: stable
decision: accepted
decided_on: 2026-10-06
generated: { by: claude-code/claude-opus-5-5, at: 2026-10-07T00:35:00Z }
---

# Decision

- Default window: **all-time**, meaning all matches we have for the player.
- Toggle: **this patch**, meaning matches since the current patch date.

# Notes

- "All-time" is limited by the API's incomplete history. See [incomplete history](../decisions/0009-preview-then-full-history.md).
- We need a source for patch dates (to be researched; see the [backlog](../recommendations/backlog.md)).
