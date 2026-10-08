---
type: Open Question
title: "Source for the Hoarder squad role now that unspent souls is dropped"
description: "The Hoarder squad role was awarded for unspent gold minutes, a stat the owner dropped, so it needs another source or must be removed."
tags: [squad, data]
status: draft
question_status: open
recommendation: "Drop The Hoarder when squad roles are built, unless a verified stat for holding souls turns up. Squad roles are not built yet, so nothing is blocked."
raised_on: 2026-10-08
generated: { by: claude-code/claude-sonnet-5-5, at: 2026-10-08T20:00:00Z }
---

# Context

[ADR 0020](../decisions/0020-squad-roles.md) and [ADR 0037](../decisions/0037-squad-roles-without-backseat-gamer.md) award "The Hoarder" for the highest per-match unspent gold minutes. The owner dropped that stat on 2026-10-08 ([ADR 0060](../decisions/0060-owner-decisions-m2-open-questions.md)): its unit is unverified and it is not in the OpenAPI spec.

# Options

| Option | Upside | Downside |
|---|---|---|
| Drop the role | Nothing to verify | Nine roles instead of ten |
| Another stat as source | Keeps ten roles | Needs a stat that is documented and verified |

# Status

Open. Squad roles are not built, so this only needs deciding before that work starts.
