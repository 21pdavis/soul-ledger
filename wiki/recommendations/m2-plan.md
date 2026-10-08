---
type: Recommendation
title: "M2 plan: PR breakdown and per-slide acceptance criteria"
description: "How to build M2 (the 11-slide 2D story) in nine PRs into staging, with a testable acceptance criterion list for every slide."
tags: [m2, plan, slides, testing]
status: draft
generated: { by: claude-code/claude-sonnet-5-5, at: 2026-10-07T12:00:00Z }
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
| 2 | Entry screen and error states | URL input, inline validation, remembered URL, "no login needed" line, full-screen error states | 1 |
| 3 | Staged loading | Three real stages from the NDJSON events, themed teasers, audio-unlock on Enter | 1, 2 |
| 4 | Slide controllers | Phone tap controller and desktop snap-scroll controller over one slide index, aria-live announcer | 1 |
| 5 | Slides 1-4 | Intro, main, roster, scavenger | 1, 4 |
| 6 | Slides 5-7 | How you kill, precision, Mid Boss | 1, 4 |
| 7 | Slides 8-10 | Roast (heatmap and unspent souls), rank journey, MVP | 1, 4 |
| 8 | Slide 11 | Summary card, Replay, Look up another player, Refresh | 1, 4 |
| 9 | Hardening | Playwright suites (phone and desktop), a11y pass, `CHANGELOG.md` | all |

PRs 5 to 8 can run in parallel once PRs 1 and 4 are merged.

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

- Shows `intro.matches` and `intro.hoursPlayed` (rounded to whole hours) as count-up counters.
- Shows "Based on N matches" from `matchCount` and a Refresh action.
- Optionally shows first and last match dates when `firstMatchAt` and `lastMatchAt` are non-null; omits them when null.
- Counters show final values instantly under reduced motion.

## 2. Your main

- Shows the hero name and monogram tile for `main.heroId`, `main.matches` and `main.winRate` as a percentage.
- Shows the global percentile line from `main.percentiles` only when it is non-empty (10 or more main-hero matches, `MIN_HERO_SAMPLE`); otherwise the line is absent and nothing breaks.
- When `main` is null the slide is skipped or shows the zero-matches state (never crashes).

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
- When nothing is notable (or `mvp` is null), falls back to the best global percentile without same-hero phrasing.
- Copy selection is unit tested for hero scope, global scope and the fallback.

## 11. Summary

- Static card with the headline numbers (matches, hours, main hero, top stat, rank), "Based on N matches", and no export (PNG export is M4).
- Offers Replay (returns to slide 1) and "Look up another player" (returns to entry).
- Refresh action reruns the lookup with `refresh=1`.

# Entry, loading and error criteria

- [component] Entry screen has the URL input, "no login needed" line, and remembers the last URL in `localStorage`; invalid input shows an inline error on submit.
- [e2e] Entering a URL starts the lookup; the Enter click is the audio-unlock gesture.
- [component] The loader moves through three stages driven only by NDJSON events (profile, history with hero ids, details fetched/total) and never advances on a timer alone.
- [e2e] `not_found`, `unavailable` / `fetch_failed` and zero-matches each render their full-screen state; unavailable has a working retry.
- [e2e] A player with few matches still plays the story, with no same-hero claims and the N-matches line shown.

# Accessibility criteria

- [component] An `aria-live` region announces each slide change.
- [e2e] One Playwright test completes the whole story, entry to summary, by keyboard only, with visible focus rings.

# Related

- Backlog items raised by M2: see [backlog](backlog.md) (streaming and auto-play, full-width desktop layouts, full-history unlock UI, per-metric MVP one-liners).
- Open questions: [hero art terms](../open-questions/m2-hero-art-terms.md), [unspent souls unit](../open-questions/m2-unspent-souls-unit.md), [rank tier names](../open-questions/m2-rank-tier-names.md), [font pairing](../open-questions/m2-font-pairing.md).
