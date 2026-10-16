---
type: Backlog
title: Backlog and recommendations
description: Prioritized list of recommended next steps, research to do, and deferred features.
tags: [backlog, planning]
status: stable
generated: { by: claude-code/claude-sonnet-5-5, at: 2026-10-08T15:00:00Z }
---

# Next

Tech debt and security hardening live in [GitHub issues labelled `tech-debt`](https://github.com/21pdavis/soul-ledger/issues?q=is%3Aissue%20is%3Aopen%20label%3Atech-debt) (rules: [tech debt](tech-debt.md)).

| Priority | Item | Links |
|---|---|---|
| P0 | Before the repo goes public (ADR 0032), fix every open issue labelled [`pre-public`](https://github.com/21pdavis/soul-ledger/issues?q=is%3Aissue%20is%3Aopen%20label%3Apre-public), including #8 and #9. They gate the M2 staging to main promotion | [ADR 0032](../decisions/0032-github-private-ci.md) |
| P0 | Build M3 per the [M3 plan](m3-plan.md): style roughs, a three-model checkpoint, then 0.3.0 and model batches | [ADR 0068](../decisions/0068-m3-scope-and-order.md) |
| P1 | Trial Haiku 5.5 for one well-specified implementer task in M3; record cost and quality in the milestone log, then decide | [ADR 0057](../decisions/0057-token-efficient-unattended-runs.md) |
| P2 | Add a PreToolUse hook that filters test output down to failures (`.claude/settings.json` is the hard-limit file, so this needs owner approval) | [ADR 0057](../decisions/0057-token-efficient-unattended-runs.md), [Claude Code costs](https://code.claude.com/docs/en/costs) |
| P2 | Move the OKF/wiki detail out of CLAUDE.md into a skill, keeping CLAUDE.md small (it loads in every agent every turn) | [ADR 0057](../decisions/0057-token-efficient-unattended-runs.md) |
| P1 | Draft and send the message to the deadlock-api maintainers: bot-friend flow for third-party sites, API key or higher limits, data-lake use | [ADR 0058](../decisions/0058-contact-maintainers-and-respect-rate-limits.md) |
| P1 | Cold-lookup queue with position and estimated wait, plus a burst load test against a stubbed API | [ADR 0058](../decisions/0058-contact-maintainers-and-respect-rate-limits.md), [ADR 0014](../decisions/0014-staged-loading.md) |
| P2 | Once the $1.50 tier is on the test account, compare in-game hero counts with `hero-stats` and our bulk-metadata counts to see what the unlock adds | [API](../research/deadlock-api.md), [test account](../research/test-account.md) |
| P2 | Pre-warm popular accounts off-peak | [ADR 0058](../decisions/0058-contact-maintainers-and-respect-rate-limits.md) |
| P2 | In-app What's new page (`/changelog`) rendering `CHANGELOG.md` | [ADR 0041](../decisions/0041-changelog-and-releases.md) |
| P1 | Check what accolade 11 (breakables) includes. The unspent-souls stat was dropped on 2026-10-08 ([ADR 0060](../decisions/0060-owner-decisions-m2-open-questions.md)) | [bulk metadata](../research/bulk-match-metadata.md) |
| P1 | Replace monogram tiles with deadlock-api hero images | [ADR 0060](../decisions/0060-owner-decisions-m2-open-questions.md) |
| P2 | Remove the unspent-souls code path (`SHOW_UNSPENT_SOULS_FIGURE`, roast copy); keep the DB column and parsing | [ADR 0060](../decisions/0060-owner-decisions-m2-open-questions.md) |
| P2 | Optional ambient sound (rain, city hum), off by default with a mute button; a separate design job, not in M3 | [ADR 0068](../decisions/0068-m3-scope-and-order.md) |
| P2 | Load the next slides' 3D assets ahead of time (like Reels), only if lag shows up in M3 | [ADR 0068](../decisions/0068-m3-scope-and-order.md) |
| P2 | Keep one city from the landing page into the story, so the camera flies from the landing circle into the opening shot instead of fading in again (and an auto-drop carries over) | [ADR 0073](../decisions/0073-city-behind-the-landing-page.md) |
| P2 | Picture-comparison tests for hero models (they hold still, so they compare reliably) | [ADR 0068](../decisions/0068-m3-scope-and-order.md) |
| P2 | Big visual style pass (fonts, look) after M3 or later | [ADR 0060](../decisions/0060-owner-decisions-m2-open-questions.md) |
| P1 | Make the cached-matches note an overlay so it stops squeezing the stage on tiny phones (#38) | [M2 plan](m2-plan.md) |
| P2 | Add an e2e reduced-motion check (today only component tests cover it) | [ADR 0054](../decisions/0054-m2-testing-and-accessibility.md) |
| P2 | Fold the slide 8-10 helpers into the shared primitives and `copy.ts` (#37) | [M2 plan](m2-plan.md) |
| P1 | Read and cite Valve's fan content policy | [monetization](../open-questions/monetization.md) |
| P2 | Source or commission occult-jazz music, and check licenses | [ADR 0006](../decisions/0006-audio.md) |
| P2 | When audio lands, unlock it on the entry screen's Enter click (deferred from M2 PR 3, which has no audio layer) | [ADR 0006](../decisions/0006-audio.md), [ADR 0052](../decisions/0052-m2-entry-loading-error-states.md) |

# Done

- **M2 playable story** (2026-10-08): entry, window control, staged loading, 11 slides, summary card, error states, axe and keyboard e2e. See the [M2 plan](m2-plan.md) outcome.
- **M1 data layer** (2026-10-06): Steam input parsing and resolution, the deadlock-api client with rate limits, the Postgres cache with job lock, incremental sync, story stats, global and same-hero percentiles, and `GET /api/lookup` (NDJSON stream). Covered by unit, integration (PGlite) and e2e smoke tests, with CI.
- Cache schema designed (`src/db/schema.ts`).
- Neon `main` migrated, and the Render Blueprint added ([ADR 0039](../decisions/0039-render-free-blueprint.md)).
- Metrics supported by the percentile endpoint: see [percentile metrics](../research/percentile-metrics.md).
- Full accolade list: see [match fields](../research/match-metadata-fields.md).
- Patch dates: [ADR 0035](../decisions/0035-patch-date-from-changelog-title.md).

# Later / deferred features

- **Hero 3D models** ([ADR 0069](../decisions/0069-m3-city-tour-and-hero-cards.md)): code-sculpted heroes did not reach the bar. In order to try: an image-to-3D tool (Meshy, Tripo, Hyper3D, Hunyuan3D) on one hero's art plus auto-rigging (Mixamo); a commissioned low-poly artist in batches; the game's own models only after checking Valve's fan-content rules. Each hero needs idle, attack and zip-line poses.

- **Hall of Fame (M6)** ranks the fun stats from our own cache, because the API has no distribution for them ([percentile metrics](../research/percentile-metrics.md)).

- Steam OpenID login ([ADR 0002](../decisions/0002-steam-id-no-login.md)).
- Username search like Statlocker's, after the URL-only prototype. The API already has `/v1/players/steam-search` (search by account id or persona name, with a recent-activity weighting) ([API](../research/deadlock-api.md)).
- The "unlock full history" flow and its UI (link the deadlock-api [ingest-cache page](https://deadlock-api.com/ingest-cache): background tool or one-time cache upload); M2 shows only "Based on N matches" plus Refresh ([ADR 0009](../decisions/0009-preview-then-full-history.md), [ADR 0052](../decisions/0052-m2-entry-loading-error-states.md), [mechanism](../open-questions/full-history-unlock.md)).
- Streaming and auto-play for the story, once the tap/scroll flow is proven ([ADR 0050](../decisions/0050-m2-story-flow-and-controllers.md)).
- Full-width desktop slide layouts that use more than the 9:16 column ([ADR 0050](../decisions/0050-m2-story-flow-and-controllers.md)).
- Per-metric MVP one-liners, replacing the single generic template ([ADR 0053](../decisions/0053-m2-copy-and-data-presentation.md)).
- More detailed filters (beyond all time / this patch), reusing the M2 window control ([ADR 0052](../decisions/0052-m2-entry-loading-error-states.md)).
- Video export ([export](../decisions/0011-sharing.md)).
- Turn shadows off in the Simple graphics level once the frame-rate auto-drop has landed, if the death-map spotlight can do without them; tune the weak-device thresholds that pick Simple from real devices.

# Standing recommendations

- Filter Street Brawl (`game_mode` 4) out of the main stats or show it separately ([match fields](../research/match-metadata-fields.md)).
- Queue every API fetch server-side behind the per-IP rate limits. Never call the API from the browser.
- Never evade the per-IP limits (IP rotation, extra outbound IPs). Ask the maintainers for more headroom instead ([ADR 0058](../decisions/0058-contact-maintainers-and-respect-rate-limits.md)).
