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

Progress 2026-10-14: world foundation, graphics levels, auto-drop, nemesis and duels, and hero cut-outs are merged into `staging`. The story-following camera is partly done (framing in #74; the per-slide target tests are still owed). Update 2026-10-15: the graphics button is now a cube icon fixed bottom-right on all devices, with its label on hover on desktop ([ADR 0070](../decisions/0070-graphics-button-is-a-corner-icon.md), PR #79, merged into `staging` 2026-10-16 01:40 UTC). Off now shows a sharper still (PR #86, 2880x1800). The owner decided both ship in 0.3.0, not a 0.3.1. Whether an auto-drop is remembered is settled in [ADR 0071](../decisions/0071-remember-auto-drop-but-never-save-off.md).

| PR | Scope | Tested by |
|---|---|---|
| World foundation (done, #73) | Canvas behind the story on phone and desktop, lazy-loaded after the story starts, fade-in, Off fallback image | e2e: canvas mounts after the story, story timing and controls unchanged, no-WebGL shows the still |
| Graphics levels (done, #75; button moved to a bottom-right cube icon in #79, sharper Off still in #86) | Full, Simple, Off; corner button; per-device memory; device-hint start; reduced motion starts Off | Unit: level choice from hints; e2e: button cycles and persists |
| Auto-drop (done, #77; a drop to Simple is remembered, a drop to Off is not: [ADR 0071](../decisions/0071-remember-auto-drop-but-never-save-off.md)) | Frame-rate monitor: below 20 fps for about 3 s drops a level with a note; never auto-raises; manual choice wins | Unit: monitor with fake frame times |
| Story-following camera (framing and nudges in #74; target-map tests still owed) | Per-slide camera and light targets with eased transitions | Unit: slide to target map; e2e: slide change updates the target |
| Heroes in the world (done as cut-outs, #80; model swap waits for the first model) | Main-hero companion, other heroes around, art cards; model replaces card when present | Unit: card or model choice |
| Nemesis and duels (done, #76; real nemesis only when at least half of deaths are tagged, else the stock rival) | Killer-slot nemesis from match data (with a fallback pairing table); duel staging with card or posed model and effect | Unit and integration: nemesis on recorded matches; e2e: duel renders |
| Hero cut-outs (done, #80) | Art-card standees placed from the stats (no models, ADR 0069) | Unit: cast placement; e2e: cards render |

# Notes from the style preview (2026-10-11)

- The owner asked that every hero model also get a **zip-line hang pose**: the climb slide shows your main riding the Blue lane's zip line.
- **Hero art in 3D:** the city's standees show a generic silhouette (`/hero-unknown-card.svg`) where the tiles show a monogram, for heroes with no card or whose card fails to load (one standee falls back, not the whole city). This adds to [ADR 0065](../decisions/0065-hero-art-served-locally.md)'s try-the-file-then-fall-back rule; the ADR is unchanged. The card-or-model choice (ADR 0068) waits for the first posed model: no unused seam is kept in the code.
- The preview tour and its look are on branch `m3-style-roughs` (`/dev/world`); map reference in [the Cursed Apple research](../research/cursed-apple-map.md).

# Settled during step 1

- **Checkpoint heroes:** the owner's top 3 are **Celeste** (id 81), **Paradox** (10) and **Ivy** (20), from deadlock-api hero stats on the owner's account and confirmed by the owner (2026-10-11). Next after them: Paige (67) and The Doorman (69).
- **Duel opponent:** the owner confirmed duels show the reader's real nemesis, as ADR 0068 already sets out (the killer slot in match data). The preview still uses a stand-in rival.
- **Still open:** the [model style](../open-questions/m3-model-style.md), faceted or sculpted.
