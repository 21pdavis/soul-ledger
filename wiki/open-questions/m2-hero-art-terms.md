---
type: Open Question
title: "Terms for using deadlock-api hero images as story art"
description: "Whether the hero images served by deadlock-api assets may be shown on the site, which gates replacing the M2 monogram tiles with real hero art."
tags: [m2, legal, assets]
status: draft
question_status: open
recommendation: "Keep monogram tiles in M2. Read the deadlock-api asset terms and Valve's fan content policy, record the result in a research page, and only then add hero art (and the M3 model references)."
raised_on: 2026-10-07
generated: { by: claude-code/claude-sonnet-5-5, at: 2026-10-07T12:00:00Z }
---

# Context

[ADR 0051](../decisions/0051-m2-visual-motion-styling-stack.md) uses deco monogram tiles instead of hero icons because the terms for Valve-owned art served by `/v1/assets/heroes` are unchecked. [ADR 0013](../decisions/0013-custom-low-poly-models.md) and [ADR 0019](../decisions/0019-code-built-hero-models.md) also use those images as reference material.

# To find out

- Does deadlock-api grant any licence for its asset images, or only relay Valve's?
- What does Valve's fan content policy allow? (Also on the [backlog](../recommendations/backlog.md).)
