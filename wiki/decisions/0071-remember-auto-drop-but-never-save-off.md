---
type: Decision Record
title: "0071: Remember an automatic graphics drop, but never save one to Off"
description: "An automatic graphics drop to Simple is saved on the device, a drop to Off lasts only for the visit, and Off is only ever saved by the reader's own choice."
tags: [m3, graphics, performance]
status: stable
decision: accepted
decided_on: 2026-10-15
generated: { by: claude-code/claude-sonnet-5-5, at: 2026-10-15T21:00:00Z }
verified: { by: human:paul, at: 2026-10-15T21:00:00Z }
---

# Context

[ADR 0068](0068-m3-scope-and-order.md) steps the graphics level down by itself when the city runs slowly, and lets the reader's choice win. The [open question](../open-questions/auto-drop-memory.md) was whether that automatic step is also remembered.

# Decision

The owner chose option 3 on 2026-10-15.

| Drop | Saved on the device? |
|---|---|
| Auto-drop to Simple | Yes, so a weak device starts lower next time |
| Auto-drop to Off | No, it lasts only for the visit |
| Off picked by the reader | Yes: Off is only ever saved by the reader's own choice |

A one-off stall therefore cannot leave the world hidden for good.

# Implementation

`onSlow` in `src/components/world/WorldLayer.tsx` already does this: it calls `saveGraphics(next)` only when `next !== "off"`. No code change.
