---
type: Open Question
title: "M3 model style: faceted blocks or sculpted low poly"
description: "Whether M3 hero models stay flat-shaded faceted (ADR 0025) or move to the sculpted, smooth-shaded low-poly look the owner asked for on the mid boss."
tags: [m3, 3d, models]
status: draft
question_status: open
recommendation: "Sculpt heroes the same way as the mid boss (smooth-blended shapes meshed once, painted colour), and supersede ADR 0025 if the owner agrees after seeing one hero."
raised_on: 2026-10-11
generated: { by: claude-code/claude-opus-5-5, at: 2026-10-11T20:00:00Z }
---

# Question

[ADR 0025](../decisions/0025-model-style.md) says models are flat-shaded and faceted, built from primitives in code. In the M3 style preview, the owner found the block-built mid boss "goofy". They asked for an Ocarina of Time-like look instead, "but a little better": one organic body, not parts built from blocks.

# What exists

- The preview's mid boss now uses a small sculpting kit (`src/components/world-preview/city/sculpt.ts` on branch `m3-style-roughs`). It works like this:
  - smooth-blended distance-field shapes (spheres, ellipsoids, tapered limbs, rings), plus carving;
  - meshed once with surface nets on a coarse grid, which gives a smooth-shaded body of about 8k triangles;
  - colour painted per shape and blended at the joins, with crease shading baked in.
- It builds in the browser at load in well under a second. For many heroes it could be built ahead of time instead.

# Options

1. **Sculpt heroes the same way** (recommended): one consistent look across the boss and the heroes, and the same tool for every model.
2. **Keep heroes faceted per ADR 0025:** heroes and the boss would look mismatched.
3. **Hand-modelled files from a 3D tool:** the best quality, but it needs modelling work outside code.

Decide at the M3 step 2 checkpoint (first three heroes).
