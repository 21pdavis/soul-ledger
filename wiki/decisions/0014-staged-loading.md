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

## Amendment: never silent (2026-10-08)

The three stages are not enough on a slow lookup: the server said nothing between the history event and the first batch of match details (a bulk request can take tens of seconds, and the rate limiter can queue it). So the stream also carries `status` events: `contacting` (first thing), `batch` (matches read of total, before each request), `rate_limited` (the limiter is holding a request, with the wait) and `finishing`. The loader always shows a note for the latest one, never a blank page, and after 20 s without any event it says the lookup is taking longer than usual and offers Try again. Status events are shown at once by the pacer ([ADR 0056](0056-loader-pacing.md)); they never advance a stage. Rate limits are unchanged ([ADR 0058](0058-contact-maintainers-and-respect-rate-limits.md)): the profile and history requests now run side by side, both on the generous general limiter.
