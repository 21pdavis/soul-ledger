---
type: Decision Record
title: "0055: Owner confirmations after M2: names, fonts, caption, unspent-souls number deferred"
description: "The owner confirmed the rank tier names and the Limelight and Space Grotesk pairing, chose urns returned for the Urn Mule caption, and deferred any unspent-souls number."
tags: [m2, copy, fonts, ranks]
status: stable
decision: accepted
decided_on: 2026-10-08
generated: { by: claude-code/claude-sonnet-5-5, at: 2026-10-08T15:00:00Z }
verified: { by: human:paul, at: 2026-10-08T13:22:00Z }
---

# Decision

The owner answered four of the questions left open at the end of M2 on 2026-10-08. They confirmed these verbally in conversation. The fifth ([hero art terms](../open-questions/m2-hero-art-terms.md)) stays open. Builds on [ADR 0051](0051-m2-visual-motion-styling-stack.md) and [ADR 0053](0053-m2-copy-and-data-presentation.md).

| # | Topic | Decision |
|---|---|---|
| 1 | Unspent-souls number on the roast slide | **No number for now.** The slide keeps its neutral sentence (`SHOW_UNSPENT_SOULS_FIGURE = false` in `src/story/copy.ts`). Showing a number is a to-do for the owner or the next milestone, tracked in #36. The [unit question](../open-questions/m2-unspent-souls-unit.md) stays **open**, because the unit is still unconfirmed. |
| 2 | Rank tier names | **Yes, they match the game.** The static map in `src/story/ranks.ts` (Obscurus, Initiate, Seeker, Acolyte, Sentinel, Mystic, Ritualist, Emissary, Oracle, Phantom, Ascendant, Eternus, taken from the API's ranks data) stands. Resolves the [tier names question](../open-questions/m2-rank-tier-names.md). |
| 3 | Fonts | **Limelight (display) with Space Grotesk (body), for now.** Resolves the [font pairing question](../open-questions/m2-font-pairing.md). Revisit once real screens and art exist, as [ADR 0031](0031-visual-identity.md) already says. |
| 4 | Urn Mule caption | The Scavenger card says **"urns returned"**, not "idols returned" (owner: "both work, but let's go urns"). Only the player-facing wording changes. The data field `idolsReturned` and the API's accolade name stay as they are, and ADR 0015 and the research may keep "idols" as the data term. |

# Consequences

- Nothing about the unspent-souls figure changes in the app. #36 stays open as a to-do: confirm the unit, fix the missing-key bias, then flip the switch.
- The rank map and fonts need no code change. They are now confirmed rather than provisional.
- The caption change is in `src/story/copy.ts` (`SCAVENGER_COPY.urnMule.detail`), covered by a component test.

> **Superseded in part ([ADR 0060](0060-owner-decisions-m2-open-questions.md)):** the unspent-souls decision (row 1 and the first consequence) is replaced by dropping the stat (#36 closed as not planned), and the hero-art question is settled: images are allowed with a Valve disclaimer.
