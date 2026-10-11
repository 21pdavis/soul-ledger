---
type: Decision Record
title: "0068: M3 scope and order: a story-following world, art cards for every hero, low-poly models after a checkpoint"
description: "M3 builds a Deadlock-flavoured 3D world that follows the story, with hero art cards for every hero, nemesis duels, three graphics levels, and low-poly posed models that start with a three-hero checkpoint."
tags: [m3, 3d, planning, performance]
status: stable
decision: accepted
decided_on: 2026-10-11
generated: { by: claude-code/claude-opus-5-5, at: 2026-10-11T06:30:00Z }
---

> **Partly superseded** by [ADR 0069](0069-m3-city-tour-and-hero-cards.md) (2026-10-11); see its "Supersedes in part" section.

# Context

The owner settled M3 in a grilling session on 2026-10-11. Since the original plan ([ADR 0028](0028-milestones.md), [ADR 0019](0019-code-built-hero-models.md)), the owner approved real hero art ([ADR 0065](0065-hero-art-served-locally.md)), so heroes no longer need a model to appear. Build steps are in the [M3 plan](../recommendations/m3-plan.md).

# Decision

## The world

| Topic | Decision |
|---|---|
| Role | One world that **follows the story**: each slide shifts the camera or light (not a static backdrop, not 11 separate scenes). On desktop's vertical card stack ([ADR 0062](0062-desktop-vertical-card-stack.md)) the card in view is the active slide, so scrolling drives the camera the same way tapping does on a phone |
| Look | A **low-poly Deadlock**: recognisably Deadlock's world (1920s occult New York, Art Deco, the Cursed Apple), not a generic or another IP's look. Some creative liberty is fine |
| Heroes in it | Your **main hero is a constant companion**, other heroes appear around the world, and **duels** stage two heroes facing off in lane (e.g. Celeste casting vs Doorman throwing a bell, Venator aiming) |
| Duel opponent | Your **nemesis**: the hero that killed you most (`death_details` killer slot). Fallback: hand-picked stock pairings |
| Sound | None in M3 (backlog) |
| Loading | The 3D loads after the story starts and fades in; it **never delays** the loading screen or the story |

## Heroes: cards first, models after a checkpoint

- Every hero appears as an **art card** (the downloaded hero art) from day one, including in duels.
- Models stay **flat-shaded, faceted low-poly** built in code ([ADR 0025](0025-model-style.md) stands). Each model also gets a **signature attack pose and effect** for duels (part animation, no rigs). The owner accepted the roughly one-third extra work per hero.
- **Checkpoint:** the owner's top 3 roster heroes are modelled first and shown beside their art and in a duel. The owner then continues, changes style, or stops at cards.
- **Order after that:** the owner's other 2 roster heroes and 2 random heroes from the most played overall, then more in batches. A model replaces its card when it exists.

## Graphics levels (phone and desktop)

| Topic | Decision |
|---|---|
| Levels | **Full**, **Simple** (fewer particles, lower detail), **Off** (a still image; also the no-WebGL fallback) |
| Control | A small corner button in the story; the choice is remembered per device and always wins over automatic changes |
| Start | Chosen from device hints (memory, cores, WebGL2). **Reduced motion starts on Off** |
| Auto-drop | Below **20 fps** for about 3 seconds (ignoring the first seconds after load) drops one level with a small note. 20 to 30 fps is acceptable. Never steps back up by itself in a visit |
| Smoothness | Avoiding stutter is part of the build (load before fade-in, lower resolution before dropping a level, instancing). Loading ahead per slide, like Reels, only if lag shows up |

## Order and releases

1. **Style:** 3 rough versions (neon Cursed Apple street, occult fog, the lane), each with a mood board, on a hidden localhost page behind the real story. Reference images load from their hosts and are **never committed** (the repo is public). The owner picks one.
2. **Model checkpoint** (above), in the picked style, on the same localhost page.
3. **0.3.0:** the world, cards, duels, graphics levels, and the checkpoint's 3 models.
4. **Model batches** as patch releases (0.3.1, …). This is a deliberate exception to [ADR 0041](0041-changelog-and-releases.md)'s one release per milestone: the owner chose waves so players get the world sooner.

## Testing

Automated tests check that the 3D loads, the Off fallback, and that story controls and timing are unaffected. The owner approves the look on localhost before anything goes to staging. Picture-comparison tests for models are backlog.

# Supersedes in part

- [ADR 0028](0028-milestones.md): M3 is the world plus art cards first; models follow a checkpoint instead of covering "all playable heroes".
- [ADR 0019](0019-code-built-hero-models.md): models no longer must cover every hero for v1; cards cover any hero without one.
- [ADR 0013](0013-custom-low-poly-models.md): the world is Deadlock-flavoured, not only fog and neon.
