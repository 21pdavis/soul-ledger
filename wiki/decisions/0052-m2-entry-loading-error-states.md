---
type: Decision Record
title: "0052: M2 entry, staged loading, error and completeness states"
description: "A URL-only entry screen, three real loading stages from the NDJSON stream, in-voice full-screen error states, and a matches-count line with a Refresh action."
tags: [m2, ux, loading, errors]
status: stable
decision: accepted
decided_on: 2026-10-07
generated: { by: claude-code/claude-sonnet-5-5, at: 2026-10-07T12:00:00Z }
---

# Decision

The owner confirmed this on 2026-10-07. Builds on [ADR 0002](0002-steam-id-no-login.md), [ADR 0014](0014-staged-loading.md) and [ADR 0006](0006-audio.md).

## Entry

- URL only: "Paste your Steam profile URL". Inline validation on submit. A "no login needed" line. The last URL is remembered in `localStorage`.
- The Enter button doubles as the audio-unlock gesture.

## Loading

Three **real** stages driven by the streamed NDJSON events of `/api/lookup`, each with themed teasers:

1. resolved / profile;
2. history, with hero ids;
3. details fetched / total counters.

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
