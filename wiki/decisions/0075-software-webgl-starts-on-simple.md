---
type: Decision Record
title: "0075: Software-drawn WebGL starts on Simple"
description: "Browsers that draw WebGL in software (SwiftShader, llvmpipe, Basic Render Driver) start on Simple instead of Full; the auto-drop to Off still applies."
tags: [m3, 3d, graphics, performance]
status: stable
decision: accepted
decided_on: 2026-10-17
generated: { by: claude-code/claude-sonnet-5-5, at: 2026-10-17T12:00:00Z }
---

Amends the starting level in [ADR 0068](0068-m3-scope-and-order.md) (owner decision, 2026-10-17).

## Decision

* A browser whose WebGL renderer string names a software rasteriser (SwiftShader, llvmpipe, softpipe, "Microsoft Basic Render Driver", Mesa OffScreen, including ANGLE-wrapped forms) starts on **Simple**, not Full (or Simple on a weak device) as before. They used to fall to Off only after running slowly. This is the case when hardware acceleration is off.
* The renderer is read in the existing one-time WebGL probe (`WEBGL_debug_renderer_info`, falling back to `RENDERER`) before the context is released.
* It is one more start hint: the lowest of it and the cores/memory hint wins.
* Unchanged: a saved choice wins, no WebGL means Off, reduced motion means Off, and the frame-rate auto-drop (Simple to Off) still applies to these players ([ADR 0071](0071-remember-auto-drop-but-never-save-off.md)).
* Detection is best-effort: where the browser hides the renderer name (Firefox with privacy settings, Safari, a generic `WebKit WebGL`), the player starts as before and the frame-rate auto-drop is the safety net.
