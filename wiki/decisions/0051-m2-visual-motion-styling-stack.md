---
type: Decision Record
title: "0051: M2 look and styling: deco typography placeholders, Framer Motion, CSS modules, no Tailwind"
description: "M2 uses typography and deco shapes as placeholder art, Framer Motion for motion, CSS modules with palette tokens as CSS variables and next/font fonts, and no Tailwind."
tags: [m2, design, styling, motion]
status: stable
decision: accepted
decided_on: 2026-10-07
generated: { by: claude-code/claude-sonnet-5-5, at: 2026-10-07T12:00:00Z }
---

# Decision

The owner confirmed this on 2026-10-07.

| Area | Decision |
|---|---|
| Placeholder art | Typography and deco shapes only, in the [ADR 0031](0031-visual-identity.md) palette. Deco **monogram tiles** stand in for hero icons. |
| Motion | Framer Motion ([ADR 0005](0005-stack.md)): about 250ms horizontal slide plus fade between slides, staggered reveals, count-up counters |
| Reduced motion | `prefers-reduced-motion`: instant crossfades and no counters |
| Styling | **No Tailwind.** CSS modules with palette tokens as CSS variables. This resolves the "revisit for M2" note in [ADR 0040](0040-m1-implementation-choices.md). |
| Fonts | An open-licence deco display face plus a grotesk, loaded with `next/font`. The pairing is an [open question](../open-questions/m2-font-pairing.md). |

# Notes

- [ADR 0031](0031-visual-identity.md) stays "accepted for now" and may still be revisited once real screens exist. M2 produces those screens, so review it then.
- Hero art from deadlock-api images waits on an [asset terms check](../open-questions/m2-hero-art-terms.md).
