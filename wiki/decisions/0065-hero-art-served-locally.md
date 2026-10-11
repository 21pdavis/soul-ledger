---
type: Decision Record
title: "0065: Show deadlock-api hero images on tiles, downloaded into the repo"
description: "The owner approved showing deadlock-api hero images on hero tiles (staging included), served from copies downloaded into public/heroes, with the monogram as the fallback."
tags: [m2, assets, hero-art, legal]
status: stable
decision: accepted
decided_on: 2026-10-09
supersedes_parts_of: [0051, 0053]
generated: { by: claude-code/claude-sonnet-5-5, at: 2026-10-09T07:00:00Z }
---

# Decision

Owner (`human:paul`), 2026-10-08 and 2026-10-09: hero art from the deadlock-api images may be used, and may go to staging. This supersedes the "no Valve art" parts of [ADR 0051](0051-m2-visual-motion-styling-stack.md) and [ADR 0053](0053-m2-copy-and-data-presentation.md) **for hero images only**. It follows [ADR 0060](0060-owner-decisions-m2-open-questions.md), which allowed the images with a not-affiliated-with-Valve notice (shipped in the footer). An earlier local version hotlinked the images; on 2026-10-09 the owner chose to download copies instead, so this ADR records the downloaded form.

| | Rule |
|---|---|
| Source | Each hero’s card and small icon from the deadlock-api assets, saved as `public/heroes/<id>-card.webp` and `<id>-sm.webp` by `scripts/fetch-hero-art.mjs` (re-run after a patch adds heroes). |
| Skipped | Art named after a different hero (Vyper and Boho point at other heroes’ art) and cards that are only the small icon enlarged; the script logs each skip. Those heroes keep the monogram. |
| Where | `HeroTile` (octagon, Main and Roster and Summary) and `HeroArt` (Mvp slide, loading screen). The large tile uses the card, the small one the icon. |
| Fallback | The monogram shows if an image is missing or fails to load. |
| Accessibility | Decorative, `alt=""`, because the hero name always sits beside the tile ([ADR 0054](0054-m2-testing-and-accessibility.md)). |
| Removal | Delete `public/heroes` and every tile reverts to monograms. |

Risk, stated plainly: other sites using the images is not a licence, and Valve’s fan content policy has not been read. Be ready to remove the art quickly if Valve asks.
