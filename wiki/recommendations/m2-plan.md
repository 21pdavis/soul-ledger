---
type: Recommendation
title: "M2 plan: PR breakdown and per-slide acceptance criteria"
description: "How to build M2 (the 11-slide 2D story) in nine PRs into staging, with a testable acceptance criterion list for every slide."
tags: [m2, plan, slides, testing]
status: draft
generated: { by: claude-code/claude-sonnet-5-5, at: 2026-10-08T09:00:00Z }
---

# Context

M2 is "the 11-slide story in 2D with placeholder art, fully playable on phone and desktop web" ([ADR 0028](../decisions/0028-milestones.md)). Decisions are in ADRs [0050](../decisions/0050-m2-story-flow-and-controllers.md) (flow), [0051](../decisions/0051-m2-visual-motion-styling-stack.md) (look and styling), [0052](../decisions/0052-m2-entry-loading-error-states.md) (entry, loading, errors), [0053](../decisions/0053-m2-copy-and-data-presentation.md) (copy and data) and [0054](../decisions/0054-m2-testing-and-accessibility.md) (testing and a11y). Slides come from [ADR 0015](../decisions/0015-v1-slides.md) and [ADR 0021](../decisions/0021-kill-slides-and-mvp.md); their data is the `Story` type in `src/lib/stats/story.ts`.

The orchestrator may deviate from this plan where useful. Every PR follows [ADR 0046](../decisions/0046-strict-red-first-tdd.md).

# Before the repo goes public

[ADR 0032](../decisions/0032-github-private-ci.md) makes the repo public with M2. Tech-debt issues **#8** and **#9** (labelled `pre-public`) must be fixed **before** that. This is a gate on going public, not part of any M2 PR below.

# PR breakdown (all into `staging`)

| # | PR | Contents | Depends on |
|---|---|---|---|
| 1 | Foundation (orchestrator) | framer-motion, palette tokens as CSS variables, `next/font` fonts, `copy` module, hero-name and tier maps, slide shell and segmented progress bar, Vitest jsdom plus React Testing Library if missing, shortlist of font pairings | none |
| 2 | Entry screen, window control and error states | URL input, inline validation, remembered URL, "no login needed" line, extensible window control (All time / This patch), full-screen error states | 1 |
| 3 | Staged loading | Three real stages from the NDJSON events, themed teasers (audio-unlock on Enter is deferred until the audio layer exists, see [backlog](backlog.md)) | 1, 2 |
| 4 | Slide controllers | Phone tap controller and desktop snap-scroll controller over one slide index, aria-live announcer | 1 |
| 5 | Slides 1-4 | Intro, main, roster, scavenger | 1, 4 |
| 6 | Slides 5-7 | How you kill, precision, Mid Boss | 1, 4 |
| 7 | Slides 8-10 | Roast (heatmap and unspent souls), rank journey, MVP | 1, 4 |
| 8 | Slide 11 | Summary card, Replay, Look up another player, Refresh | 1, 4 |
| 9 | Hardening | Playwright suites (phone and desktop), a11y pass, `CHANGELOG.md`, fold the per-slide copy files into `copy.ts` | all |

PRs 5 to 8 can run in parallel once PRs 1 and 4 are merged.

**Follow-up: copy is split per slide group.** To avoid merge conflicts between the parallel slide PRs, each one keeps its own slide copy in a sibling module (`src/story/copy-slides-1-4.ts` for PR 5) instead of the single `copy` module that [ADR 0053](../decisions/0053-m2-copy-and-data-presentation.md) calls for. PR 9 (hardening) folded them all into `src/story/copy.ts` (done), so copy is edited in one place again.

**Follow-ups for the slide PRs** (the story player is mounted in the app, and the placeholder stage is gone):
- PR 5 (slides 1-4, #33) owns the window-label e2e: the story shows "All time" or "Since patch <date>" (`WindowLabel`). It was dropped from `entry.spec.ts` because no slide shows it yet; App's side is covered in `tests/component/app-story-props.test.tsx`.
- PR 8 (slide 11, #31) owns the Refresh, Replay and Look up another player e2e, including Refresh with `refresh=1` and the same window. The summary slide is the first place those buttons exist again. Its card must not repeat the Valve notice: the app's notices strip is below the player and always on screen.

# Cross-cutting acceptance criteria

Each is testable at the layer in brackets.

- [unit] Slide-index logic: next/back clamp at 0 and 10; back on slide 1 is a no-op; a tap while animating completes the animation without advancing.
- [e2e phone] Tapping the right side advances, the left goes back; the progress bar shows 11 segments with the current one filled.
- [e2e desktop] Scrolling lands on one of 11 snap checkpoints; arrows, space and progress-bar clicks change the slide and the scroll position follows.
- [component] With `prefers-reduced-motion`, counters render their final value at once and transitions are instant.
- [component] Every slide renders from a fixture `Story` with all text in the DOM.
- [unit] Palette text/background pairs meet WCAG AA contrast.

# Per-slide acceptance criteria

`Story` fields in code font. Every headline is fixed per slide and lives in the `copy` module ([ADR 0053](../decisions/0053-m2-copy-and-data-presentation.md)). Hero names come from the static map, shown with a monogram tile.

## 1. Intro

- Shows `intro.matches` and `intro.hoursPlayed` as count-up counters. Hours show one decimal under 10 hours and whole hours from 10 up, and never read "0 hours" (a unit test covers 0.2, 9.96 and 120).
- Shows "Based on N matches" from `matchCount` and a Refresh action.
- Optionally shows first and last match dates when `firstMatchAt` and `lastMatchAt` are non-null; omits them when null.
- Counters show final values instantly under reduced motion.

## 2. Your main

- Shows the hero name and monogram tile for `main.heroId`, `main.matches` and `main.winRate` as a percentage.
- With 10 or more main-hero matches (`MIN_HERO_SAMPLE`), `main.percentiles` is non-empty and the slide shows the **same-hero** line, "Top X% of <Hero> players", from its best entry (lowest `topPercent`). It is never labelled global.
- Below 10 matches, `main.percentiles` is empty. The slide then shows the best entry from the global `story.percentiles` with global phrasing (no hero name), or no percentile line if that is also empty. Nothing breaks either way.
- Not notable (same rule as the MVP slide): if the best entry of whichever list applies is above 50, the slide shows neutral copy with no percentile claim ("Top 87% of ..." is never shown). Exactly 50 still shows the claim.
- `main` is null only when `matchCount === 0`, and the story never mounts then (see the zero-matches rule below). The story always has exactly 11 slides and 11 checkpoints; no slide is ever skipped.

## 3. Roster

- Shows `roster.heroesPlayed`.
- Shows the "one-trick" label when `roster.label` is `one-trick` and "flex" otherwise (50% line, [ADR 0038](../decisions/0038-one-trick-threshold-50.md)).
- Lists up to 5 `topHeroes` with name, matches and win rate, in the given order.

## 4. Scavenger card

- One card with three stats: Crate Goblin (`scavenger.breakables`, top-left), Gambler (`sinnerJackpots`, middle-right), Urn Mule (`idolsReturned`, bottom-left).
- Each shows its label and a count-up value; a zero value still renders (as 0), not blank.

## 5. How you kill

- Shows `kills.total` and the breakdown of bullet, ability, melee and headshot kills.
- Shows close-up versus long-distance (`closeup`, `longDistance`).
- Breakdown proportions are computed without dividing by zero when `kills.total` is 0.

## 6. Precision

- Shows `precision.heroAccuracy` and `headshotRate` as percentages.
- Parry badge follows `parryLabel`: "king" and "clown" show distinct copy with `parrySuccess` and `parryMiss`; "none" shows neutral copy or hides the parry block.
- A unit test pins the 60% king line to the value of `PARRY_KING_RATE` ([ADR 0040](../decisions/0040-m1-implementation-choices.md)).

## 7. Mid Boss

- Shows `midBoss.claimed`; shows `midBoss.stolen` when above 0.
- With 0 claimed, shows friendly in-voice copy rather than an empty stat.

## 8. Roast

- Death heatmap: `roast.deathPositions` binned into a grid by a pure function (unit tested for empty input, a single point, points on cell borders, and out-of-range points), drawn as an SVG density plot on an abstract deco frame with no map.
- Copy names the hottest cell: "You died here N times", where N equals that cell's count.
- With no positions, the plot is replaced by friendly copy.
- Shows `roast.deaths` and, when `worstMatch` is non-null, the worst match's deaths and hero.
- Unspent souls from `avgUnspentGoldMinutes` shown as a plain sentence once the [unit is verified](../open-questions/m2-unspent-souls-unit.md); no unit is claimed before then.
- Data-driven copy variant selection is covered by unit tests.

## 9. Rank journey

- Plots `rank.journey` over time as badges; the current badge is `rank.current`.
- Tier names come from the static map; an unknown tier shows the fallback format "Tier 4 · 2" (tier and subrank). See [tier names](../open-questions/m2-rank-tier-names.md).
- An empty journey or null `current` shows friendly copy; a single point renders without a line.

## 10. MVP

- Uses one generic template: label, `topPercent` and scope (`global` or `hero`, with the hero name in the hero case).
- The `hero` scope uses same-hero phrasing; the `global` scope never mentions a hero.
- "Not notable" means the best `topPercent` is above 50. Then the slide shows the best global stat from `story.percentiles` with neutral copy and no same-hero phrasing.
- `mvp === null` (only when `story.percentiles` is empty) has its own friendly copy.
- Copy selection is unit tested for hero scope, global scope, the above-50 fallback and null.

## 11. Summary

- Static card with the headline numbers (matches, hours, main hero, top stat, rank), "Based on N matches", and no export (PNG export is M4).
- Offers Replay (returns to slide 1) and "Look up another player" (returns to entry).
- Refresh action reruns the lookup with `refresh=1`.

# Entry, loading and error criteria

- [component] Entry screen has the URL input, "no login needed" line, and remembers the last URL in `localStorage`; invalid input shows an inline error on submit.
- [e2e] Entering a URL starts the lookup. (The Enter click becoming the audio-unlock gesture is deferred: M2 has no audio layer, see [backlog](backlog.md).)
- [component] The loader moves through three stages driven only by NDJSON events (profile, history with hero ids, details fetched/total) and never advances on a timer alone.
- [e2e] The story never mounts when `matchCount === 0`. This includes players whose only games are Street Brawl (`excludedMatches > 0`). They get the zero-matches screen.
- [component] When the story event has `stale: true` (a refresh failed and the story comes from older cached matches), a short "showing cached matches" note appears.
- [component] The loader tolerates a `waiting` event (shows a waiting state, does not error or skip a stage).
- [e2e] `not_found`, `unavailable` / `fetch_failed` and zero-matches each render their full-screen state; unavailable has a working retry.
- [e2e] A player with few matches still plays the story, with no same-hero claims and the N-matches line shown.

# Window control criteria (PR 2)

The ADR 0004 this-patch toggle is in M2 ([ADR 0052](../decisions/0052-m2-entry-loading-error-states.md)). It is built as an extensible filter/window control, a first step towards the "more detailed filters" in the [backlog](backlog.md), not a one-off boolean.

- [component] The entry screen has a selector with **All time** (default) and **This patch**.
- [unit] The control's state is a typed filter object (today only `window: "all" | "patch"`), so a new filter is a new field and option, not a new component. No other filters are added in M2.
- [unit] The selection maps to the lookup URL as `window=all|patch` (default `all`).
- [component] The selection is remembered in `localStorage` like the last URL, and restored on return.
- [component] The story shows which window it is: "All time", or "since patch <date>" using `patchStart` from the lookup response. The label never uses a client-computed date.
- [component] If `window === "patch"` but `patchStart === null` (the server could not find the patch date and returned all-time data; tracked in #25), the story is labelled "All time" or says the patch date couldn't be found. It is never labelled "This patch".
- [unit] `patchStart` is formatted in UTC (`timeZone: "UTC"`), so it shows the same date everywhere. A test runs in a negative-offset timezone (for example `America/Los_Angeles`) and expects the UTC date, not the day before.
- [component] Refresh (`refresh=1`) and Replay keep the current window: Refresh reruns the lookup with the same `window`.
- [component] "Based on N matches" uses `matchCount` of the returned story, so it reflects the window.
- [e2e] Choosing This patch sends `window=patch` to `/api/lookup`.
- [e2e] A patch window with zero counted matches shows the zero-matches screen. Under 10 main-hero matches follows the few-matches rule (story plays, same-hero claims dropped, N-matches line shown). The copy for both can mention the window, for example "no matches since the latest patch".
- Dependency: patch dates are settled ([ADR 0035](../decisions/0035-patch-date-from-changelog-title.md), implemented in `src/lib/patches.ts`). A hotfix with no changelog post would not move the window; this is accepted.

# Accessibility criteria

- [component] An `aria-live` region announces each slide change.
- [e2e] One Playwright test completes the whole story, entry to summary, by keyboard only, with visible focus rings.
- [e2e] `@axe-core/playwright` (pinned) scans the entry screen, every loading stage, the error and zero-matches screens and all 11 slides (a full and a sparse story) on phone and desktop. Any violation fails, not only serious and critical ones, and no rule is disabled (`tests/e2e/a11y.spec.ts`, built in PR 9). Its one finding was a missing h1 on the loading screen.
- Playwright ports are overridable (`PLAYWRIGHT_PORT`, `PLAYWRIGHT_GATE_PORT`) so several worktrees can run e2e at once; a server already listening is only reused on the default ports (`PLAYWRIGHT_REUSE_SERVER=0` turns reuse off there too).

# Related

- Backlog items raised by M2: see [backlog](backlog.md) (streaming and auto-play, full-width desktop layouts, full-history unlock UI, per-metric MVP one-liners).
- Open questions: [hero art terms](../open-questions/m2-hero-art-terms.md), [unspent souls unit](../open-questions/m2-unspent-souls-unit.md), [rank tier names](../open-questions/m2-rank-tier-names.md), [font pairing](../open-questions/m2-font-pairing.md).
