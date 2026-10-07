---
type: Open Question
title: "Source of the current patch date for the this-patch toggle"
description: Findings on /v1/patches title dates versus pub_date; resolved by ADR 0035.
tags: [data, api, patches]
status: stable
question_status: resolved
resolved_by: ../decisions/0035-patch-date-from-changelog-title.md
recommendation: "Use the MM-DD-YYYY date in the newest /v1/patches title (UTC midnight), falling back to pub_date. Already implemented provisionally in src/lib/patches.ts."
raised_on: 2026-10-06
generated: { by: claude-code/claude-opus-5-5, at: 2026-10-07T05:00:00Z }
sources:
  - id: patches
    resource: https://api.deadlock-api.com/v1/patches
    title: deadlock-api changelog feed
---

Answers the backlog item "find a reliable source for patch dates" ([ADR 0004](../decisions/0004-time-window.md)).

# Findings (2026-10-06)

| Endpoint | What it is | Problem |
|---|---|---|
| `/v1/patches` | Forum changelog posts. Titles look like `09-16-2026 Update`.[^patches] | `pub_date` is the post's **last edit**. Three different patches all show 2026-09-16. |
| `/v2/patches` | Steam news posts | Includes non-patch news (hero announcements). |
| `/v1/patches/big-days` | Dates of major updates | Only the big ones. The newest is 2026-03-11. |

The newest entry is titled `09-29-2026` but has `pub_date` 2026-10-05. The title date matches the actual patch.

# Recommendation

Parse the title date and fall back to `pub_date` when a title has none. Cache the list for 6 h. Open risk: a hotfix with no changelog post would not move the window.

[^patches]: deadlock-api changelog feed
