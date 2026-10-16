---
type: Open Question
title: "Should an automatic graphics drop be remembered?"
description: "Whether an automatic graphics drop is remembered on the device, only for the visit, or remembered except for Off."
tags: [m3, graphics, performance]
status: stable
question_status: resolved
resolved_by: ../decisions/0071-remember-auto-drop-but-never-save-off.md
recommendation: "Remember an auto-drop but never save an auto-drop to Off, so a one-off stall cannot leave the world hidden for good."
raised_on: 2026-10-14
generated: { by: claude-code/claude-sonnet-5-5, at: 2026-10-14T12:00:00Z }
---

# Should an automatic graphics drop be remembered?

[ADR 0068](../decisions/0068-m3-scope-and-order.md) says the reader's choice is remembered and wins over automatic changes, and that the level steps down by itself when the city runs slowly. It does not say whether that automatic step is also saved.

## Options

1. **Remember it per device** (first version of the code): a weak device starts lower next time. Downside: one bad stall can leave the world as a still picture for good, with nothing marking it as automatic.
2. **Remember it only for the visit:** nothing sticks, but a weak device re-learns it every visit.
3. **Remember it, but never save an auto-drop to Off:** weak devices start on Simple next time, and Off is only ever saved by the reader's own choice.

## Recommendation

Option 3. The code follows it for now: a drop to Simple is saved, a drop to Off applies for the visit only. Resolved 2026-10-15: the owner chose option 3 ([ADR 0071](../decisions/0071-remember-auto-drop-but-never-save-off.md)).
