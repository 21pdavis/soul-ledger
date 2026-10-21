---
type: Decision Record
title: "0077: One city from the landing page into the story"
description: "The 3D city mounts once for the whole visit, so the story starts with a camera flight from the landing circle into the opening shot; the cast is built only after the first card is up and its shaders compile in the background."
tags: [m3, 3d, landing, performance]
status: stable
decision: accepted
decided_on: 2026-10-17
generated: { by: claude-code/claude-opus-5-5, at: 2026-10-17T22:00:00Z }
---

Amends the "Story" row and the consequences of [ADR 0073](0073-city-behind-the-landing-page.md). Keeps the "never delays the story" rule of [ADR 0068](0068-m3-scope-and-order.md).

# Context

The owner asked (2026-10-17) for the backlog item "keep one city from the landing page into the story": seamless is better. They reviewed it on localhost, reported a stutter as the story started, and signed off once it was gone.

# Decision

| Topic | Decision |
|---|---|
| One city | App mounts the world once. The entry, loading, error and story screens all sit in front of the same city, so the story never remounts it |
| Hand-over | When the story starts, the camera flies from wherever the landing circle is down into the opening shot. "New lookup" glides it back up into the circle |
| Never delays the story | The city gets the story only once the first card is up and the browser is idle. Until then it keeps circling |
| Building the cast | The cast loads in its own Suspense boundary, so the city stays on screen while it loads. It stays hidden until the whole scene's shaders (with the cast's lights, for the same target the effects draw into) compile in the background with `compileAsync` |
| No stalls on first draw | Shadows use the standard style (`shadows="percentage"`): three.js swaps the retired soft style for it on the first shadow, which threw away every warmed-up shader. three.js's shader error check is off, because reading the driver logs forces each shader to finish on the spot |
| Mid-boss mesh | Its sculpted body (about 100 ms to mesh) is built once per page in a worker while the landing page is up, and shared |

# Consequences

- A drop to Off on the landing page now carries into the story (same city, same level).
- Shader compile errors no longer log to the console. Our shaders are three.js's own; turn the check back on locally when writing a custom shader.
- The landing page's own start-up still has a short stall (about 0.75 s on the dev server) while React builds the city's roughly 2,000 objects. Merging the buildings into a few meshes is in the [backlog](../recommendations/backlog.md).
