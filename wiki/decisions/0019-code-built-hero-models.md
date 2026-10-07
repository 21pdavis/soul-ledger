---
type: Decision Record
title: "0019: Build stylized low-poly models for all heroes in code"
description: All playable heroes get stylized low-poly models built procedurally in code (Three.js primitives), using API images and other views as reference.
tags: [3d, art]
status: stable
decision: accepted
decided_on: 2026-10-06
generated: { by: claude-code/claude-opus-5-5, at: 2026-10-06T14:00:00Z }
---

# Decision

- Claude builds the models **in code**: Three.js/R3F primitives and procedural geometry, stylized and low-poly. The user explicitly chose this over AI image-to-3D or commissioning.
- **Scope for v1: every playable hero.** That is 44 as of 2026-10-06; see [hero roster](../research/hero-roster.md). The roster comes from the API, so a new hero shows as a 3D card fallback until its model exists.
- References are API hero images plus other views (turnarounds, trailers), used for **reference only, never redistributed**.

Refines [ADR 0013](0013-custom-low-poly-models.md). Style: [ADR 0025](0025-model-style.md).
