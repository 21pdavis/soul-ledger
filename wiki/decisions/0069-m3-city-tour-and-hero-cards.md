---
type: Decision Record
title: "0069: M3 world is a low-poly City Never Sleeps tour; heroes stay art cards for 0.3.0"
description: "The M3 world is a static low-poly copy of the post-update map that the camera tours lane by lane, and heroes appear as art-card cut-outs in 0.3.0 because code-sculpted hero models did not reach the quality bar."
tags: [m3, 3d, planning]
status: stable
decision: accepted
decided_on: 2026-10-11
generated: { by: claude-code/claude-opus-5-5, at: 2026-10-11T22:00:00Z }
---

# Context

M3 step 1 ([ADR 0068](0068-m3-scope-and-order.md)) built style previews on a hidden localhost page (`/dev/world`, branch `m3-style-roughs`). The owner reviewed them over several rounds on 2026-10-11:

- They rejected three generic rough worlds.
- They chose a copy of the real map ([research](../research/cursed-apple-map.md)).
- Step 2 then sculpted Celeste in code twice (the [model style question](../open-questions/m3-model-style.md)). The owner judged both versions not good enough. We agreed that hand-built code models will not reach the quality heroes need.

# Decision

## The world

| Topic | Decision |
|---|---|
| Scene | A **static, low-poly copy of the City Never Sleeps map**: three lanes with their stops, the four districts, the mid boss and the bases. Steady lights only (no flicker). |
| Tour | One shot per slide. It starts in the **Yellow lane**, runs down the **Blue** lane, and ends in the **Green** lane. |
| Camera | Level and weaving along a lane. It swoops over the rooftops when changing lanes. It goes overhead only for the death map and the summary. |
| Stats in the scene | Who stands where comes from the reader's stats. The roast slide shows the reader's real death heat map, projected onto the city from overhead. Duels show the reader's real nemesis. |
| Landmarks | Each lane's bridge and the Guardians. The **mid boss** is a sculpted low-poly model in its sewer pit under Times Square: chunky creatures and buildings work with the code sculpting kit. |
| Desktop cards | Thinner, and alternating left and right, with the scene framed beside each card. |

## Heroes

- In **0.3.0, every hero is an art card**, shown as a cut-out standee in the city. There are no code-sculpted hero models.
- Real hero models are deferred. The options are an image-to-3D trial, a commissioned artist, or the game's own models (that last one only after checking Valve's fan-content rules). They are in the [backlog](../recommendations/backlog.md).
- If models come later, each hero needs an idle pose, an attack pose and a **zip-line pose** (the climb slide shows the main riding the zip line).

# Supersedes in part

- [ADR 0068](0068-m3-scope-and-order.md):
  - the world's look is this map tour, not a generic Deadlock-flavoured world;
  - the model checkpoint ended at "stop at cards", so 0.3.0 ships no hero models and there are no model batch releases for now.
- [ADR 0025](0025-model-style.md): there are no code-built hero models for now, so its style rules are on hold until hero models return.
- [ADR 0062](0062-desktop-vertical-card-stack.md): with the world behind the story, desktop cards are no longer wide and centred. They are at most 30rem (or 42% of the width), alternating left and right per slide. The vertical stack and scroll checkpoints stay.

# How it is built

- The player reports its current slide (`onSlideChange`), and the story stage puts the world layer behind it.
- The 3D code loads only after the story starts. Off (also chosen for reduced motion, and wherever WebGL is missing) shows a still render of the city (`public/world/still.webp`, our own render).
- Browser tests run with graphics Off by default, because test browsers draw WebGL in software, far too slowly for the story tests. `world.spec.ts` turns graphics back on to test the world itself.
