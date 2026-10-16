---
type: Decision Record
title: "0070: The graphics button is a cube icon in the screen's bottom-right corner"
description: "The graphics-level control is a small cube icon fixed in the bottom-right corner of the screen, outside the story frame, on every device; on desktop it widens on hover or focus to name the level."
tags: [m3, ui, graphics]
status: stable
decision: accepted
decided_on: 2026-10-15
generated: { by: claude-code/claude-opus-5-5, at: 2026-10-15T20:00:00Z }
---

# Context

[ADR 0068](0068-m3-scope-and-order.md) gave the graphics levels "a small corner button in the story". It shipped as a "Graphics: Off" pill centred under the story. On phones under 700px tall there was no room for it: inside the frame it covered the summary's buttons and Refresh, and reserving a strip under the frame made slides overflow ([#79](https://github.com/21pdavis/soul-ledger/pull/79)). The owner chose the design below on 2026-10-15 after seeing screenshots.

# Decision

| Concern | Choice |
|---|---|
| Look | A small cube icon in a round button; the level is in its accessible name |
| Place | Fixed in the screen's bottom-right corner on every device, outside the story frame |
| Phone | Sits at the right end of the notice strip under the story; the bottom notice keeps a gap on its right for it |
| Desktop | Widens on hover or keyboard focus to read "Graphics: Off/Simple/Full" |
| Note | The "graphics lowered" note sits just above it, right-aligned |

Also part of this change: on phones the story frame keeps 8px at the top, so its outer rule is not clipped when the frame fills the screen's height.

# Consequences

- Nothing covers slide content at any phone size; e2e checks this at 320x568, 360x640, 360x699 and 412x915.
- On a phone the level is not written on screen; the icon is tapped to cycle and the note announces automatic drops.
