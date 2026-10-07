---
type: Reference
title: Playable hero roster
description: The current playable heroes from /v1/assets/heroes, the list v1 must model.
resource: https://api.deadlock-api.com/v1/assets/heroes
tags: [heroes, data-source, 3d]
status: stable
generated: { by: claude-code/claude-opus-5-5, at: 2026-10-06T14:00:00Z }
verified: { by: claude-code/claude-opus-5-5, at: 2026-10-06T14:00:00Z }
stale_after: 2026-11-06T00:00:00Z
---

There are **44 playable heroes** as of 2026-10-06. This matches the "currently playable" list on [deadlock.wiki/Heroes](https://deadlock.wiki/Heroes).

**Filter rule:** an entry counts as playable when `disabled` is false **and** either `player_selectable` is true or `development_state` is `release` or `pre_release`.

**Correction:** the first version of this page counted 39, because it filtered on `player_selectable && !in_development`. That rule wrongly excluded:
- **Baba**, whose `development_state` is `release` but whose `in_development` flag is stale;
- the four **pre_release** heroes, Deadman Danny, Nurse Harrow, Solomon and Violet, which have `player_selectable: false` and `prerelease_only: true`.

The roster changes with patches, so the app must read it from the API, not hard-code it.

- Abrams
- Apollo
- Baba
- Bebop
- Billy
- Calico
- Celeste
- Deadman Danny
- Drifter
- Dynamo
- Graves
- Grey Talon
- Haze
- Holliday
- Infernus
- Ivy
- Kelvin
- Lady Geist
- Lash
- McGinnis
- Mina
- Mirage
- Mo & Krill
- Nurse Harrow
- Paige
- Paradox
- Pocket
- Rat King
- Rem
- Seven
- Shiv
- Silver
- Sinclair
- Solomon
- The Doorman
- Venator
- Victor
- Vindicta
- Violet
- Viscous
- Vyper
- Warden
- Wraith
- Yamato

Each hero entry carries `images` (card, small and minimap images on `assets-bucket.deadlock-api.com`) and `colors`. Both feed reference and palette for the [code-built models](../decisions/0019-code-built-hero-models.md).
