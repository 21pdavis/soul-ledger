---
type: Open Question
title: "Font pairing for the M2 story"
description: "Which open-licence deco display face and grotesk to pair via next/font for the art-deco occult look."
tags: [m2, design, fonts]
status: stable
question_status: resolved
resolved_by: ../decisions/0055-owner-confirmations-after-m2.md
recommendation: "The foundation PR shortlists two or three open-licence pairings (for example a Google Fonts deco display face with a clean grotesk), shows them on a sample slide in the plan, and the owner picks one. Default to the first pairing until then."
raised_on: 2026-10-07
generated: { by: claude-code/claude-sonnet-5-5, at: 2026-10-08T15:00:00Z }
---

# Context

[ADR 0051](../decisions/0051-m2-visual-motion-styling-stack.md) fixes the approach: an open-licence deco display face plus a grotesk loaded with `next/font`. The owner chose to pick the actual pairing later, from options shown in the [M2 plan](../recommendations/m2-plan.md). The fonts must keep WCAG AA contrast and numerals readable ([ADR 0054](../decisions/0054-m2-testing-and-accessibility.md)).

# Status

The foundation PR ships the default pairing: **Limelight** (art-deco display) with **Space Grotesk** (body and numerals), both Google Fonts via `next/font`, wired as `--font-display` and `--font-body` in `src/app/tokens.css`. The owner accepted this pairing **for now** on 2026-10-08 ([ADR 0055](../decisions/0055-owner-confirmations-after-m2.md)). It may be revisited once real screens and art exist ([ADR 0031](../decisions/0031-visual-identity.md) already says so); swapping is a one-line change in `src/app/layout.tsx`.
