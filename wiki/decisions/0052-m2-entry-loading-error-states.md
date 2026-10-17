---
type: Decision Record
title: "0052: M2 entry, staged loading, error and completeness states"
description: "A URL entry screen with an All time / This patch window control, three real loading stages from the NDJSON stream, in-voice full-screen error states, and a matches-count line with a Refresh action."
tags: [m2, ux, loading, errors]
status: stable
decision: accepted
decided_on: 2026-10-07
generated: { by: claude-code/claude-sonnet-5-5, at: 2026-10-08T14:00:00Z }
---

# Decision

The owner confirmed this on 2026-10-07. Builds on [ADR 0002](0002-steam-id-no-login.md), [ADR 0014](0014-staged-loading.md) and [ADR 0006](0006-audio.md).

## Entry

- URL input (no login): "Paste your Steam profile URL". Inline validation on submit. A "no login needed" line. The last URL is remembered in `localStorage`.
- The Enter button is meant to double as the audio-unlock gesture, but **M2 has no audio layer** (music is a P2 [backlog](../recommendations/backlog.md) item), so there is nothing to unlock and the unlock is deferred until audio lands.

## Loading

Three **real** stages driven by the streamed NDJSON events of `/api/lookup`, each with themed teasers:

1. resolved / profile;
2. history, with hero ids;
3. details fetched / total counters.

### Pacing

Each stage is held on screen for a minimum time, the tally counters take a minimum time to count up, and the story waits for the last stage plus a short tail, so a quick lookup can still be read. Events still decide every stage: time only delays showing them, and never advances one. See [ADR 0056](0056-loader-pacing.md).

## Window control

- The ADR 0004 **this-patch toggle is in M2** (owner, 2026-10-07; [ADR 0004](0004-time-window.md) stays accepted). The entry screen has a selector, **All time** (default) or **This patch**, sent as `window=all|patch` to `/api/lookup` and remembered in `localStorage` like the URL. Refresh and Replay keep the current window. If the patch date is unknown, the server returns `window: "all"` with `patchUnavailable: true` and the story is labelled All time, with a short note (issue #25).
- It is built as an **extensible filter/window control** (a typed filter object, not a boolean) as a test run for more detailed filters later. No specific extra filters are decided; see the [backlog](../recommendations/backlog.md).
- The story shows its window ("since patch <date>" from the response's `patchStart`). Patch dates come from [ADR 0035](0035-patch-date-from-changelog-title.md). An empty or thin patch window uses the zero-matches and few-matches states below.

## Completeness

- "Based on N matches" (`story.matchCount`) on the intro and summary slides, plus a **Refresh** action (lookup with `refresh=1`).
- No unlock UI in M2: the [ADR 0009](0009-preview-then-full-history.md) unlock is not built (see the [backlog](../recommendations/backlog.md)).

## Errors

Full-screen, in-voice, deco-styled states:

| Case | Behaviour |
|---|---|
| Invalid input | Inline on the input |
| `not_found` | Tell the player to check their profile is public |
| `unavailable` / `fetch_failed` | Retry, "try again in a minute" |
| Zero matches | Friendly screen |
| Few matches (under 10 per hero) | The story still plays, same-hero claims are dropped (M1 already omits them), and the N-matches line shows |
