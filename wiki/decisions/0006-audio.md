---
type: Decision Record
title: "0006: Royalty-free or commissioned occult-jazz music, synthesized stingers, muted until click"
description: Music is royalty-free or commissioned 1920s-occult-jazz, UI stingers are synthesized with Web Audio, audio stays muted until a start-splash click, and Valve audio is never used.
tags: [audio, legal, ux]
status: stable
decision: accepted
decided_on: 2026-10-06
generated: { by: claude-code/claude-opus-5-5, at: 2026-10-07T00:35:00Z }
---

# Decision

- **Music**: royalty-free or commissioned, in a 1920s occult-jazz style to match Deadlock's setting.
- **UI stingers**: synthesized at runtime with the Web Audio API.
- **Autoplay**: everything stays muted until the user clicks a start splash. That click also satisfies browser autoplay policy.
- **Never use Valve's audio**, even though `/v1/assets/sounds` exists. This keeps us clear of fan-content and licensing risk.

# Related

- [Loading sequence](../decisions/0014-staged-loading.md): the themed loader can double as the audio-unlock click.
