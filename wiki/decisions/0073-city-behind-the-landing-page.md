---
type: Decision Record
title: "0073: The city sits behind the landing page too"
description: "The 3D city loads on the landing page as scenery (no heroes, a slow circling camera) and stays behind the loading and error screens; the story still mounts its own city."
tags: [m3, 3d, landing, performance]
status: stable
decision: accepted
decided_on: 2026-10-15
generated: { by: claude-code/claude-opus-5-5, at: 2026-10-15T23:30:00Z }
---

Amends the "Loading" row of [ADR 0068](0068-m3-scope-and-order.md) and the "loads only after the story starts" line of [ADR 0069](0069-m3-city-tour-and-hero-cards.md).

# Context

After 0.3.0 the owner asked for the landing page to have the 3D city behind it as well (2026-10-15), and approved the look on localhost. ADRs 0068 and 0069 said the 3D loads only after the story starts, so this needs recording.

# Decision

| Topic | Decision |
|---|---|
| Where | The entry, loading and error screens show the city behind them. One layer stays mounted across those screens |
| What | Scenery only: the city with no heroes, duel or death map. The camera circles the map slowly from above |
| Graphics | The same levels and rules as the story ([ADR 0068](0068-m3-scope-and-order.md), [ADR 0071](0071-remember-auto-drop-but-never-save-off.md)). The cube button shows here too. Off, reduced motion and no WebGL show the still picture |
| Loading | The 3D still loads lazily, after the page is up, as a separate download. The entry form and the loading screen render first and never wait for it. It starts while the reader pastes their URL, so by the time the story begins the city's code is usually already downloaded |
| Story | The story still mounts its own city, which follows the slides. The hand-over fades the city in again from the browser's cache |

# Consequences

- The "never delays" rule still holds: the entry and loading screens never wait for the 3D.
- Moving from the landing page to the story remounts the city, so it fades in again and an auto-drop to Off on the landing page doesn't carry over (a drop to Simple does, because it is saved). Keeping one city across both, so the camera flies from the landing circle into the opening shot, is in the [backlog](../recommendations/backlog.md).
