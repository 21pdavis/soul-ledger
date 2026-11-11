---
type: Decision Record
title: "0079: M4 sharing scope: slide pictures, share links, 90-day expiry"
description: "M4 ships slide pictures, public share links that replay the frozen story for 90 days, a link preview image, a rate limit and a weekly cleanup job together in 0.4.0; video export is out."
tags: [m4, sharing, planning]
status: stable
decision: accepted
decided_on: 2026-11-11
generated: { by: claude-code/claude-sonnet-5-5, at: 2026-11-11T12:00:00Z }
---

# Context

The owner settled M4 in a grilling session on 2026-11-11. It refines [ADR 0011](0011-sharing.md) and [ADR 0018](0018-story-snapshots.md). Build steps are in the [M4 plan](../recommendations/m4-plan.md). Everything below ships together in 0.4.0.

# Decision

## Slide pictures

| Topic | Decision |
|---|---|
| Model | Copy Spotify Wrapped: a Share button on every slide plus the summary slide |
| Phones | Opens the native share sheet (a website can't post straight to Instagram Stories) |
| Desktop | Downloads the picture or copies the link |
| Picture | The slide as a flat design over a fixed, pre-made city still; tall 9:16 only |
| Footer | Small: Soul Ledger name, site address and share date |

## Share links

| Topic | Decision |
|---|---|
| Who | Anyone viewing a story can make one. No login; the stats are public anyway |
| When | A snapshot is created only when someone taps Share; the same story reuses the same link |
| Address | `/w/<name>-<random>`. The name is the Steam name at share time, reduced to plain letters and digits, capped at about 20 characters. If nothing usable is left, the random part alone |
| Rate limit | Link creation is capped at 10 a minute per visitor: the same per-IP, in-memory limiter as [ADR 0076](0076-per-ip-lookup-rate-limit.md), but its own counter (sharing does not use up the lookup allowance), with the same staging-key exemption |
| Storage | A new table holds shared stories |

## Opening a link

- It plays the **full frozen replay with the 3D city**.
- The first and last slides show "Shared <date> · numbers from that day".
- Refresh and the saved-matches note are hidden. In their place: **"See their latest"** (fetches fresh data and plays the live story) and **"Look up your own"**.

## Expiry and cleanup

- Links expire after **90 days**. An expired link shows "This story has expired" with a "See their latest" button. Expired links are refused at read time.
- A **weekly Render cron job** (about $1 a month) deletes expired rows. The owner creates the Render service, since agents can't.
- Rejected: cleaning up inside the share request (mixes concerns, and a cleanup failure could break sharing); Neon pg_cron (Neon advises it only on always-on computes, and ours scales to zero); a GitHub scheduled workflow (it would put the production database password in GitHub).

## Link preview and removal

- **Preview:** a wide OG image with the player name, main hero art, matches, main hero and rank, over the city.
- **Hero art** on slide pictures and previews follows [ADR 0065](0065-hero-art-served-locally.md) (the owner confirmed hero art on the preview, 2026-11-11), with the monogram as the fallback for a hero without art.
- **Removal:** player data removal stays in the removal form, now in M7 ([ADR 0080](0080-roadmap-analytics-security-legal-milestone.md)), and will cover shared stories too.

## Not in scope

Video export.

# Supersedes in part

- [ADR 0011](0011-sharing.md): the sharing format is now slide pictures (9:16 over a city still) and share links as above.
- [ADR 0018](0018-story-snapshots.md): snapshots are created on Share, reused, expire after 90 days, and the address carries a name.
