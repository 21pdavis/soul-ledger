---
type: Decision Record
title: "0038: A one-trick plays their main in at least 50% of matches"
description: The roster slide labels a player a one-trick when their most-played hero accounts for 50% or more of counted matches, otherwise flex.
tags: [stats, slides]
status: stable
decision: accepted
decided_on: 2026-10-06
generated: { by: claude-code/claude-opus-5-5, at: 2026-10-07T06:00:00Z }
---

# Decision

- **One-trick:** the main hero's share of counted matches is **at least 50%**. Otherwise the player is **flex**. Used by the roster slide ([ADR 0015](0015-v1-slides.md), slide 3).
- The user lowered the line from 60% to 50%. No established community threshold exists; see the background in [ADR 0036](0036-one-trick-threshold.md).

Supersedes [ADR 0036](0036-one-trick-threshold.md).
