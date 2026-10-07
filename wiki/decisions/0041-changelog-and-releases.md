---
type: Decision Record
title: "0041: CHANGELOG.md plus a tagged GitHub Release per milestone"
description: Release notes live in CHANGELOG.md (Keep a Changelog); each milestone is a minor version tagged and published as a GitHub Release, with an in-app What's new page later.
tags: [process, releases]
status: stable
decision: accepted
decided_on: 2026-10-07
generated: { by: claude-code/claude-opus-5-5, at: 2026-10-07T05:00:00Z }
---

# Decision

| Concern | Choice |
|---|---|
| Release notes | `CHANGELOG.md` at the repo root, in [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) format. Changes go under **Unreleased** as PRs land. |
| Versions | Each milestone is a **minor** version: M1 = `0.1.0`, M2 = `0.2.0`, and so on. Fixes between milestones are **patch** versions (`0.1.1`). v1 ships as `1.0.0`. `package.json` `version` matches. |
| Releases | When a milestone ships: move Unreleased into a dated version section, merge, tag `vX.Y.Z` on the merge commit, and publish a **GitHub Release** with that section as its notes. |
| Players | Later, an in-app **What's new** page (`/changelog`) renders the same file. That comes in M2 or after, once there is a UI. |

`wiki/log.md` stays the knowledge-base log for us and agents. `CHANGELOG.md` is what players and visitors read.

First release: **v0.1.0**, milestone M1 ([ADR 0028](0028-milestones.md)).
