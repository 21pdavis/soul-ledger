---
type: Decision Record
title: "0056: Loader pacing: minimum dwell per stage, real events still gate stages"
description: "The staged loader holds each real stage on screen for a minimum time and holds the story back for the last stage's dwell plus a tail, so a quick lookup can be read; a timer never advances a stage."
tags: [m2, ux, loading, pacing]
status: stable
decision: accepted
decided_on: 2026-10-08
generated: { by: claude-code/claude-sonnet-5-5, at: 2026-10-08T14:00:00Z }
---

# Decision

The owner liked the staged loading screen but found it flashed by too fast ("not really slow, just enough to read it"). Refines [ADR 0014](0014-staged-loading.md) and [ADR 0052](0052-m2-entry-loading-error-states.md); it does not change them: **real events still gate every stage, and a timer never advances one** (no fake progress).

Only **display pacing** changes:

| Rule | Behaviour |
|---|---|
| Stage dwell | Once a real event moves the loader to a stage (profile, history, details), that stage stays up for at least `stageDwellMs` before the next stage may be shown, even if the next event has already arrived. Early events wait in a queue, one per stage, in stage order. |
| Updates in place | More `details` events for the stage on screen, repeated events and `waiting` are shown at once. Counters never go backwards. `done` is not a stage: it is shown with the stage before it. |
| Tally count-up | Counters take at least `tallyCountMs` to count up, however fast the data came (a burst of details, or a cached player). |
| Final tail | The story replaces the loader only after the last stage has had its dwell plus `finalTailMs`. |
| Errors | An `error` event shows its screen at once, with no dwell, and drops the queue. |
| Slow lookups | A lookup whose real events are slower than the dwell and tail is not delayed: pacing only holds back events that arrive faster. |
| Reduced motion | Same dwell (players still need time to read), just no animation. |
| Screen readers | One polite announcement per stage change, made when the stage is **shown**, not when its event arrives. |
| Skip | No Skip button. |

## Values

All in one place, `src/lib/client/loading-pace.ts` (`LOADING_PACE`):

| Constant | Value |
|---|---|
| `stageDwellMs` | 1600 |
| `tallyCountMs` | 1200 |
| `finalTailMs` | 1000 |

A fully cached lookup (resolved, profile, history with nothing new, done and the story all within ~100 ms) takes about 4.2 s in the pacer and about 4.5 s from click to story in the browser. Retune the three constants there; the unit test keeps a cached lookup between 3.5 s and 5.5 s.

# As built

- `createLoadingPacer` is a pure state machine over an explicit clock: `push(event, now)` and `advance(now)` return the events to show, the story or error once it may be released, and `wakeAt` (when to call again). `App` owns the one timer and routes every stream event, including the final one, through the pacer; the `LoadingScreen` still renders purely from the events it is given.
- **Turning pacing off for tests.** A `localStorage` value `soul-ledger:loading-pace` = `"off"` selects `NO_PACE` (all zeros). It can only remove delay and never changes what is shown, so a player setting it just sees the loader go by faster; it cannot be used to slow or alter anything. `playwright.config.ts` starts every browser context with it set, so the existing suites do not slow down; `tests/e2e/loading-pace.spec.ts` opts out and proves the real pacing (stages in order, a dwell apart, the story after the last dwell plus the tail, and the cached-lookup duration). The App component tests pass `pace={NO_PACE}`; `tests/component/app-pacing.test.tsx` covers the pacing with fake timers.
- A build-time `NEXT_PUBLIC_` flag was rejected: e2e builds once, and staging e2e (`pnpm test:e2e:staging`) runs against a deployed build, so the switch has to be a runtime one.
