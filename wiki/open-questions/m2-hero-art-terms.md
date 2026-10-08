---
type: Open Question
title: "Terms for using deadlock-api hero images as story art"
description: "Whether the hero images served by deadlock-api assets may be shown on the site, which gates replacing the M2 monogram tiles with real hero art."
tags: [m2, legal, assets]
status: draft
question_status: open
recommendation: "Keep the monogram tiles for now (option A). Before M3, read the deadlock-api asset terms and Valve's fan content policy, record what they say in a research page, and then choose between linking to the API's pictures (B) and drawing our own (C)."
raised_on: 2026-10-07
generated: { by: claude-code/claude-sonnet-5-5, at: 2026-10-08T15:00:00Z }
---

# Context

**The question in plain words.** Deadlock-api serves a picture for every hero (icons and portraits, at `assets-bucket.deadlock-api.com`). May we show those pictures in Soul Ledger? Today the app does not: each hero appears as a **monogram tile**, a letter in a circle on a deco-styled badge. The pictures are Valve's artwork, and we have not yet read what deadlock-api or Valve allow people to do with them. Nobody has decided this, and this page does not claim to know the answer.

**Why it matters.**

- The nicer 2D UI would look much better with real hero faces in the roster, main-hero and summary slides.
- M3 builds low-poly 3D hero models using those pictures as reference material ([ADR 0013](../decisions/0013-custom-low-poly-models.md), [ADR 0019](../decisions/0019-code-built-hero-models.md)).

[ADR 0051](../decisions/0051-m2-visual-motion-styling-stack.md) chose monogram tiles for M2 so the story could ship without answering this.

# Options

| Option | What it means | Upside | Downside |
|---|---|---|---|
| A. Keep the monogram tiles | No Valve artwork anywhere in the app | Nothing to check, ships today | Plainer look |
| B. Link to the API's pictures | The browser loads each image straight from `assets-bucket.deadlock-api.com`, after we have read the API's terms and Valve's fan content policy | Real hero faces with little work | Depends on terms we have not read, and on the API keeping those URLs |
| C. Make our own art | Our own illustrations or the code-built models from M3, not Valve's pictures | No dependence on anyone's terms | Most work, and the M3 models would still need the pictures only as private reference |

# To find out (before choosing B)

- Does deadlock-api grant any licence for its asset images, or only relay Valve's?
- What does Valve's fan content policy allow? (Also on the [backlog](../recommendations/backlog.md).)

# Status

Open. The owner asked on 2026-10-08 what this meant, so this page was rewritten in plain language for them to decide; no decision yet. Recommendation: stay on A for now and read the two sets of terms before M3.
