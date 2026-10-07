---
type: Decision Record
title: "0025: Hero models are flat-shaded faceted low-poly with simple part animation"
description: Code-built hero models use a flat-shaded faceted style built around silhouette and signature prop, with part animation and no skeletal rigs.
tags: [3d, art]
status: stable
decision: accepted
decided_on: 2026-10-06
generated: { by: claude-code/claude-opus-5-5, at: 2026-10-06T16:00:00Z }
---

# Decision

- **Style:** flat-shaded, faceted low-poly. Each model is built around the hero's **silhouette and signature prop**. Colors come from the API hero `colors`, plus emissive accents.
- **Animation:** simple part animation only (idle bob, prop glow, turn to face the camera). **No skeletal rigs.**
- A subtle toon outline pass is an optional later polish.

Refines [ADR 0019](0019-code-built-hero-models.md).
