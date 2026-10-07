---
type: Decision Record
title: "0013: Build our own low-poly hero models from reference images"
description: The 3D uses custom stylized low-poly hero models made from API hero images and other reference views; no ripped game models.
tags: [3d, art]
status: stable
decision: accepted
decided_on: 2026-10-06
generated: { by: claude-code/claude-opus-5-5, at: 2026-10-06T12:00:00Z }
---

# Decision

- We build **our own stylized low-poly hero models**. References are the API hero images plus other images, such as 360 turnarounds, trailers and fan sites. These are used as **reference only, never redistributed**.
- No models extracted from game files.
- The world around the heroes is procedural: fog, Cursed Apple neon, particles.

# Open

How the models get made, and how many heroes to model, is in [model pipeline](0019-code-built-hero-models.md).
