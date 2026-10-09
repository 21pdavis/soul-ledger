---
type: Decision Record
title: "0063: Two-depth CI: smoke end-to-end on PRs into staging, full suite with coverage into main"
description: "A PR into staging runs format, lint, typecheck, unit tests and a smoke browser set; the staging to main PR and pushes to main run the full browser suite and unit tests with coverage."
tags: [process, ci, testing]
status: stable
decision: accepted
decided_on: 2026-10-09
generated: { by: claude-code/claude-sonnet-5-5, at: 2026-10-09T01:00:00Z }
---

# Decision

The owner asked for this after the full browser suite took 11 to 12 minutes per CI run, which made every fix attempt expensive. It refines [ADR 0047](0047-streamlined-review-and-ci.md).

| Change | Runs |
|---|---|
| PR into `staging`, code changes | Format, lint, wiki check, typecheck, unit and integration tests, the production build, and the **smoke** browser set |
| PR into `main` (`staging` to `main`) and pushes to `main` | The same, with the **full** browser suite and unit tests **with coverage** |
| Docs-only PR | Unchanged from ADR 0047: format, lint and the wiki check |
| Pushes to `staging` | Smoke, like a PR into `staging` |

**Smoke set** (`pnpm test:e2e:smoke`): the entry, full-story, gate, home, keyboard, loading, story-player and window-label specs, plus the slide-fit check at the tightest phone size (360x640), the size that caught a real regression on 2026-10-09. The accessibility (axe) spec, the summary-card size matrix and the other slide-fit sizes run only in the full suite. Locally the smoke set takes about 50 seconds against 72 for the full suite.

# Why

Browser tests are the slowest step and most PRs touch one small area. The full run still happens before anything reaches production, where the owner reviews the PR anyway. The risk is a layout bug at an unchecked size reaching `staging` and being found at promotion. The tightest size is kept in the smoke set to make that unlikely.

# Consequences

- The speed-up is not measured in CI yet. Locally the full browser suite takes about 1.2 minutes, but CI took 8.5 minutes for the same step (a slower machine, plus the build), so expect the smoke set to save roughly a third of that. Re-measure after the first runs. The 2 minutes of unit tests and the build are untouched.
- Coverage is reported only (`src/lib` and `src/db`, per `vitest.config.mts`). No threshold is enforced.
- Agents merging into `staging` still need green CI on the final commit, as in [ADR 0044](0044-pr-gated-changes-and-agent-review.md).
