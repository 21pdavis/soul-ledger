---
type: Recommendation
title: "M3 plan: steps, owner checkpoints and the first PR breakdown"
description: "How to build M3 (the 3D world and hero models) in four owner-gated steps, from style roughs to model batches, with the PRs for 0.3.0."
tags: [m3, plan, 3d]
status: draft
generated: { by: claude-code/claude-opus-5-5, at: 2026-10-11T22:00:00Z }
---

# Steps

Decisions: [ADR 0068](../decisions/0068-m3-scope-and-order.md). Each step ends with something the owner looks at; nothing large is built before the style is picked. M3 starts after M2 is on production.

| Step | Built | Owner checkpoint |
|---|---|---|
| 1. Style | R3F and drei installed; a hidden, dev-only preview page with 3 rough worlds behind the real story, each beside a mood board (images hot-linked, never committed) | Picks one |
| 2. Model checkpoint | Done 2026-10-11: two sculpted Celeste versions; outcome **stop at cards** ([ADR 0069](../decisions/0069-m3-city-tour-and-hero-cards.md)) | Done |
| 3. 0.3.0 | The PRs below | Approves the `staging` to `main` PR |
| 4. Model batches | On hold: hero models are in the backlog (ADR 0069) | |

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
| Hero cut-outs | Art-card standees placed from the stats (no models, ADR 0069) | Unit: cast placement; e2e: cards render |

# Notes from the style preview (2026-10-11)

- The owner asked that every hero model also get a **zip-line hang pose**: the climb slide shows your main riding the Blue lane's zip line.
- The preview tour and its look are on branch `m3-style-roughs` (`/dev/world`); map reference in [the Cursed Apple research](../research/cursed-apple-map.md).

# Settled during step 1

- **Checkpoint heroes:** the owner's top 3 are **Celeste** (id 81), **Paradox** (10) and **Ivy** (20), from deadlock-api hero stats on the owner's account and confirmed by the owner (2026-10-11). Next after them: Paige (67) and The Doorman (69).
- **Duel opponent:** the owner confirmed duels show the reader's real nemesis, as ADR 0068 already sets out (the killer slot in match data). The preview still uses a stand-in rival.
- **Still open:** the [model style](../open-questions/m3-model-style.md), faceted or sculpted.
