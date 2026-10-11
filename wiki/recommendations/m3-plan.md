---
type: Recommendation
title: "M3 plan: steps, owner checkpoints and the first PR breakdown"
description: "How to build M3 (the 3D world and hero models) in four owner-gated steps, from style roughs to model batches, with the PRs for 0.3.0."
tags: [m3, plan, 3d]
status: draft
generated: { by: claude-code/claude-opus-5-5, at: 2026-10-11T19:00:00Z }
---

# Steps

Decisions: [ADR 0068](../decisions/0068-m3-scope-and-order.md). Each step ends with something the owner looks at; nothing large is built before the style is picked. M3 starts after M2 is on production.

| Step | Built | Owner checkpoint |
|---|---|---|
| 1. Style | R3F and drei installed; a hidden, dev-only preview page with 3 rough worlds behind the real story, each beside a mood board (images hot-linked, never committed) | Picks one |
| 2. Model checkpoint | The owner's top 3 roster heroes as low-poly models (idle pose, attack pose with effect, and a zip-line hang pose for the climb slide) in the picked style, each beside its art, plus one duel | Continue, change style, or stop at cards |
| 3. 0.3.0 | The PRs below | Approves the `staging` to `main` PR |
| 4. Model batches | Other 2 roster heroes and 2 random top heroes, then more; one patch release per batch | Approves each release |

Iterate on localhost first and get the owner's sign-off before PRs to `staging` (visual work).

# 0.3.0 PR breakdown (draft, refine after step 2)

| PR | Scope | Tested by |
|---|---|---|
| World foundation | Canvas behind the story on phone and desktop, lazy-loaded after the story starts, fade-in, Off fallback image | e2e: canvas mounts after the story, story timing and controls unchanged, no-WebGL shows the still |
| Graphics levels | Full, Simple, Off; corner button; per-device memory; device-hint start; reduced motion starts Off | Unit: level choice from hints; e2e: button cycles and persists |
| Auto-drop | Frame-rate monitor: below 20 fps for about 3 s drops a level with a note; never auto-raises; manual choice wins | Unit: monitor with fake frame times |
| Story-following camera | Per-slide camera and light targets with eased transitions | Unit: slide to target map; e2e: slide change updates the target |
| Heroes in the world | Main-hero companion, other heroes around, art cards; model replaces card when present | Unit: card or model choice |
| Nemesis and duels | Killer-slot nemesis from match data (with a fallback pairing table); duel staging with card or posed model and effect | Unit and integration: nemesis on recorded matches; e2e: duel renders |
| Checkpoint models | The 3 approved models | Owner sign-off; e2e: models load |

# Notes from the style preview (2026-10-11)

- The owner asked that every hero model also get a **zip-line hang pose**: the climb slide shows your main riding the Blue lane's zip line.
- The preview tour and its look are on branch `m3-style-roughs` (`/dev/world`); map reference in [the Cursed Apple research](../research/cursed-apple-map.md).

# Open at the start of M3

- Which heroes are the owner's top 3 (from the roster card of the owner's account).
