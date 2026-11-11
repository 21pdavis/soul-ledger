---
type: Decision Record
title: "0081: M4 sharing build decisions: server-built stories, link reuse, pictures"
description: "How the M4 share feature behaves as built: the server rebuilds stories itself, links are reused per player, slugs fold accents, pictures fold unsupported names and are cached briefly."
tags: [m4, sharing, security]
status: stable
decision: accepted
decided_on: 2026-11-11
generated: { by: claude-code/claude-sonnet-5-5, at: 2026-11-11T23:30:00Z }
---

# Context

Choices made while building M4 ([ADR 0079](0079-m4-sharing-scope.md), [plan](../recommendations/m4-plan.md), PRs #115-#122). The first-slide label is an owner decision; the rest were made in the build and merged after agent review.

# Decision

| Topic | Decision |
|---|---|
| Trust | The server rebuilds the shared story from its own cached match data. It never trusts a story sent by the client. |
| Link reuse | Per player, by a content hash of story + window + player name and avatar. An existing link is reused only if it has more than 7 days left; otherwise a new one is made. |
| Slugs | Name slugs fold accents and letters like ø and ß to plain letters. |
| First slide | Shared stories label it "<Name>'s story" (owner decision, 2026-11-11). |
| Picture names | Name characters the picture font can't draw (CJK, emoji) fold to "A Soul Ledger player", because CJK fonts are too large to bundle. |
| Image caching | Slide and preview images are cached at most a day and never past the link's expiry, with an in-process LRU and a per-IP render limit. |
| E2E hook | The fixture hook (`SHARED_STORY_FIXTURES`) is ignored on Render. |
| Weekly cleanup | The owner creates the Render cron only after 0.4.0 is live and production is migrated (steps in the [plan](../recommendations/m4-plan.md)). |

# Known gaps

* #119: no global ceiling on the number of share rows.
* #123: being fixed.
