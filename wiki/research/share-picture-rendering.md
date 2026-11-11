---
type: Reference
title: "Rendering share pictures with next/og"
description: "What next/og (satori) accepts for the 9:16 slide pictures: no WebP, no variable fonts, flexbox only; and how the city stills are captured."
tags: [m4, sharing, satori, images]
status: draft
generated: { by: claude-code/claude-sonnet-5-5, at: 2026-11-11T14:00:00Z }
---

# Findings (next 16.3.8, `next/og`, checked 2026-11-11)

| Topic | Finding | What we did |
|---|---|---|
| Image formats | Satori reads PNG, APNG, JPEG, GIF and SVG. A WebP data URI crashes the render with `u2 is not iterable`. | Hero cards are WebP, so `sharp` converts them to PNG (max 512px) once per process. |
| Fonts | A variable TTF (Space Grotesk `[wght]`) fails to parse (`reading '256'`). Static TTF and WOFF load. | Limelight static TTF and Space Grotesk Regular WOFF (fontsource) under `public/share/fonts/`. |
| CSS | Flexbox only, no grid or CSS variables. Every `div` with several children needs `display: flex`. | The builder (`src/share-picture/build.tsx`) uses inline styles and host elements only. |

# City stills

One 1080x1920 JPEG per slide in `public/share/stills/`, captured from the real 3D city by `scripts/capture-city-stills.ts`: a phone-sized window at 2x, graphics forced to Full by cycling the corner button (a hand-picked level stops the automatic drop to Off that software WebGL triggers, [ADR 0075](../decisions/0075-software-webgl-starts-on-simple.md)), everything but the world hidden. Re-run it after the city changes.

Related: [ADR 0079](../decisions/0079-m4-sharing-scope.md), [M4 plan](../recommendations/m4-plan.md).
