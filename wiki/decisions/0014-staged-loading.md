---
type: Decision Record
title: "0014: Themed loading in stages with sneak peeks"
description: The wait for data is the intro, revealed in stages that tease upcoming slides; the start click unlocks audio.
tags: [ux, loading]
status: stable
decision: accepted
decided_on: 2026-10-06
generated: { by: claude-code/claude-opus-5-5, at: 2026-10-06T12:00:00Z }
---

# Decision

Loading is the intro, in stages. Each fetch phase reveals a teaser, for example:

1. Steam profile and avatar appear (instant).
2. Match history arrives, and the match count and hero icons flicker in.
3. Bulk match details stream in, with live counters (crates, kills) ticking up.

The "Enter" click doubles as the browser's audio-unlock gesture.
