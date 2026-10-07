---
type: Vision
title: Vision
description: A Spotify-Wrapped-style animated stat story for Deadlock players, with rankings, squad comparisons and shareable exports.
tags: [vision, product]
status: stable
generated: { by: claude-code/claude-opus-5-5, at: 2026-10-07T00:35:00Z }
---

# Pitch

**Deadlock Wrapped** is a fun stat tracker for Valve's game *Deadlock*, presented like Spotify Wrapped: animated full-screen story slides, Three.js visuals and music.

# What it covers

- **Basic stats**: win rates, main heroes, roster breadth, rank journey.
- **Fun stats**: boxes and crates broken, Sinner's Sacrifice, urns (idols) returned, headshots, parries, Mid Boss rejuvenators, and similar.
- **Rankings**: how the player compares with other players (percentiles).

# Experience

- A linear Wrapped **story** first, then a **dashboard/hub** to explore ([ADR 0003](decisions/0003-story-then-dashboard.md)).
- The story is exportable and shareable.
- **Squad mode**: friends load themselves in to compare with each other ([ADR 0002](decisions/0002-steam-id-no-login.md)).
- Tone: mostly hype, with a roast slide or two ([ADR 0007](decisions/0007-tone-hype-with-roasts.md)).
- 1920s occult-jazz soundtrack that stays muted until the user clicks ([ADR 0006](decisions/0006-audio.md)).

# Constraints

- Public from day one, but cheap: every lookup is cached in our own Postgres ([ADR 0001](decisions/0001-public-site-postgres-cache.md)).
- Data comes from [deadlock-api.com](research/deadlock-api.md). Coverage of match history is incomplete.
- Fan project under Valve's fan content policy, non-commercial ([open question](open-questions/monetization.md)).

# See also

- [Open questions](open-questions/index.md)
- [Backlog](recommendations/backlog.md)
