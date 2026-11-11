---
type: Decision Record
title: "0011: Share via PNG cards plus a hosted story link"
description: Exports are PNG cards per slide plus a summary card, and every story also gets a shareable URL viewable on the site.
tags: [sharing, export]
status: stable
decision: accepted
decided_on: 2026-10-06
generated: { by: claude-code/claude-opus-5-5, at: 2026-10-06T12:00:00Z }
---

# Decision

- **PNG cards:** one per slide, plus a final summary card. This matches what Spotify Wrapped does.
- **Hosted story link:** a URL that replays the story on our site. Stories must therefore be stored. See [story persistence](0018-story-snapshots.md).
- **Video export:** deferred.

> **Superseded in part ([ADR 0079](0079-m4-sharing-scope.md)):** the sharing format is now slide pictures and 90-day share links.
