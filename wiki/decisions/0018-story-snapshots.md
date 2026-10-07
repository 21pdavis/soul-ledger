---
type: Decision Record
title: "0018: Shared stories are frozen JSON snapshots with OG images"
description: Each shared story is a frozen JSON snapshot at /w/<slug> with a generated preview image and a see-my-latest button.
tags: [sharing, data]
status: stable
decision: accepted
decided_on: 2026-10-06
generated: { by: claude-code/claude-opus-5-5, at: 2026-10-06T14:00:00Z }
---

# Decision

- A shared story is a **frozen JSON snapshot** of the computed story, stored in Postgres and served at `/w/<slug>`.
- Each one gets a generated **Open Graph image**, so links unfurl as cards in Discord and Twitter.
- A "see my latest" button regenerates the story from fresh data.

Refines [ADR 0011](0011-sharing.md).
