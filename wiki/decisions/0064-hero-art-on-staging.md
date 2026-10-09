---
type: Decision Record
title: "0064: Show deadlock-api hero images on tiles, staging included"
description: "The owner approved showing hero images from the deadlock-api assets bucket on hero tiles (also on staging), replacing the monogram tiles for hero images only, with the monogram as fallback."
tags: [m2, assets, hero-art, legal]
status: stable
decision: accepted
decided_on: 2026-10-08
supersedes_parts_of: [0051, 0053]
generated: { by: claude-code/claude-sonnet-5-5, at: 2026-10-08T21:00:00Z }
---

# Decision

Owner (`human:paul`), 2026-10-08: hero art from the deadlock-api images may be used, and may go to staging. This supersedes the "no Valve art" parts of [ADR 0051](0051-m2-visual-motion-styling-stack.md) and [ADR 0053](0053-m2-copy-and-data-presentation.md) **for hero images only**. It follows [ADR 0060](0060-owner-decisions-m2-open-questions.md), which allowed the images with a not-affiliated-with-Valve disclaimer; the risk noted there stands (Valve's fan content policy is unread).

| | Rule |
|---|---|
| Source | `https://assets-bucket.deadlock-api.com/assets-api-res/images/heroes/<slug>_sm.webp`, hotlinked. No Valve files are committed. |
| Mapping | Static hero id to slug table in `src/story/hero-images.ts` (from `/v1/assets/heroes`). Ids without a usable image are left out. |
| Fallback | `MonogramTile` keeps the monogram underneath. It shows while loading, on image error, and for ids with no image. |
| Accessibility | Decorative, `alt=""`, because the hero name always sits beside the tile ([ADR 0054](0054-m2-testing-and-accessibility.md)). |
| Removal | Delete the table entries (or the file's contents) and every tile reverts to monograms. |

Known API gaps (2026-10-08): Vyper (58) and Boho (68) point at other heroes' art, and Shield Guy, Bomber and a few unreleased ids have none, so they stay monograms.
