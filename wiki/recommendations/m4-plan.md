---
type: Recommendation
title: "M4 plan: the PR breakdown for sharing (0.4.0)"
description: "How to build M4 (slide pictures, share links, link previews and weekly cleanup) in eight PRs into staging, ending with release 0.4.0."
tags: [m4, plan, sharing]
status: draft
generated: { by: claude-code/claude-sonnet-5-5, at: 2026-11-11T12:00:00Z }
---

# Steps

Decisions: [ADR 0079](../decisions/0079-m4-sharing-scope.md). Anything not specified there is "decided in the build". The Hoarder [open question](../open-questions/hoarder-role-source.md) only affects squad mode (M6), so it doesn't block M4.

# 0.4.0 PR breakdown (draft)

| PR | Scope |
|---|---|
| 1. Storage | Shared-stories table, migration, repository and the name-slug builder (letters and digits, about 20 characters, random fallback) |
| 2. Share API | Create a snapshot on Share, reuse the link for the same story, 10 a minute per visitor ([ADR 0076](../decisions/0076-per-ip-lookup-rate-limit.md) mechanism) |
| 3. `/w/[slug]` page | Frozen replay with the 3D city, shared-mode controls ("See their latest", "Look up your own"), "Shared <date> · numbers from that day" line, expired page |
| 4. Slide pictures | Render each slide as a 9:16 flat design with the footer, plus the city stills per scene |
| 5. Share button UI | Native share sheet on phones; download or copy link on desktop |
| 6. Link preview | Wide OG image (name, main hero art, matches, main hero and rank, over the city) and page metadata |
| 7. Weekly cleanup | Cleanup script deleting expired rows, plus the owner's Render cron setup (agents can't create the service) |
| 8. Release 0.4.0 | Changelog, version bump and release per [ADR 0041](../decisions/0041-changelog-and-releases.md) |

How each PR is tested, and any owner checkpoints: decided in the build. Visual work iterates on localhost first.
