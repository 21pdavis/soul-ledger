---
type: Decision Record
title: "0035: The current patch starts on the date in the newest changelog title"
description: The this-patch window starts at UTC midnight of the MM-DD-YYYY date in the newest /v1/patches title, falling back to pub_date.
tags: [data, patches]
status: stable
decision: accepted
decided_on: 2026-10-06
generated: { by: claude-code/claude-opus-5-5, at: 2026-10-07T05:30:00Z }
---

# Decision

- The "this patch" window ([ADR 0004](0004-time-window.md)) starts at **UTC midnight of the date in the newest `/v1/patches` changelog title** (for example `09-29-2026 Update`).
- If a title has no date, use that post's `pub_date`.
- Cache the changelog list for 6 h.

# Why

`pub_date` is the post's last edit, not the patch date. Findings: [patch date source](../open-questions/patch-date-source.md).

# Known gap

A hotfix with no changelog post does not move the window.
