# Directory Update Log

## 2026-10-06
* **Decision**: [ADR 0039](decisions/0039-render-free-blueprint.md): deploy from `main` via a Render Blueprint on the free plan in Oregon. Migrated Neon `main`. M1 is in [PR #1](https://github.com/21pdavis/soul-ledger/pull/1) with CI green.
* **Decision**: [ADR 0038](decisions/0038-one-trick-threshold-50.md) lowers the one-trick line to 50%.
* **Deprecation**: [ADR 0036](decisions/0036-one-trick-threshold.md) is superseded by ADR 0038.
* **Decision**: [ADR 0035](decisions/0035-patch-date-from-changelog-title.md) takes the patch date from the changelog title, resolving the [open question](open-questions/patch-date-source.md). [ADR 0036](decisions/0036-one-trick-threshold.md) sets the one-trick line at 60%; no established threshold exists in gaming communities. [ADR 0037](decisions/0037-squad-roles-without-backseat-gamer.md) drops The Backseat Gamer and supersedes ADR 0020.
* **Deprecation**: [ADR 0020](decisions/0020-squad-roles.md) is superseded by ADR 0037.
* **Research**: Breakables show healthy spread (CV 0.41, about 1.8 to 4.2 per minute between p10 and p90) in [bulk metadata](research/bulk-match-metadata.md).
* **Milestone**: Built **M1, the data layer**, test-first: Steam input resolution, the rate-limited deadlock-api client, the Neon cache with job lock, incremental sync, story stats, percentiles, and `GET /api/lookup` (NDJSON). There are 128 unit and integration tests plus e2e smoke on phone and desktop, and CI on every push. The Neon `dev` branch is migrated, and a live lookup of the test account works (about 8 s cold, 1.4 s cached).
* **Research**: Added [bulk match metadata](research/bulk-match-metadata.md) and [percentile metrics](research/percentile-metrics.md). The [accolade list](research/match-metadata-fields.md) is now complete (31). Noted that `only_active=true` undercounts the [hero roster](research/hero-roster.md).
* **Creation**: Open questions on [M1 implementation choices](open-questions/m1-implementation-choices.md) and the [patch date source](open-questions/patch-date-source.md).
* **Update**: Refreshed the [backlog](recommendations/backlog.md) for M2.
* **Milestone**: The user confirmed shared understanding. The interview is complete. Username search was added to the [backlog](recommendations/backlog.md); the prototype stays URL-only.
* **Decision**: Recorded round-5 answers as [ADRs 0031-0034](decisions/index.md): visual identity, GitHub private with CI, the Neon project, tooling. No open questions remain.
* **Infra**: Created the Neon project `soul-ledger` (`icy-bread-38573768`) with `main` and `dev` branches. Created the private GitHub repo `21pdavis/soul-ledger`.
* **Research**: Test-account coverage: 352 of ~650 games (~54%) are available without payment.
* **Decision**: Recorded round-4 answers as [ADRs 0024-0030](decisions/index.md): AGPL-3.0, faceted low-poly model style, fetching in Next.js routes, music sourcing, milestones (phone and desktop web), TDD as cornerstone, repo rename.
* **Correction**: The [hero roster](research/hero-roster.md) is 44 heroes, not 39 (the old filter missed Baba and the pre_release heroes).
* **Research**: Added the [primary test account](research/test-account.md).
* **Update**: Renamed the product to Soul Ledger in the README and wiki.
* **Decision**: Recorded round-3 answers as [ADRs 0016-0023](decisions/index.md): open source with Patreon, full history via the user's own Patreon tier for now, story snapshots, code-built models for all heroes, squad roles, kill slides and MVP, the name **Soul Ledger**, and Hall of Fame privacy.
* **Research**: Added the [hero roster](research/hero-roster.md): 39 playable heroes.
* **Creation**: Round-4 [open questions](open-questions/index.md).
* **Decision**: Recorded round-2 answers as [ADRs 0008-0015](decisions/index.md) (ranking, preview then unlock, squad mode, sharing, phone-first, custom low-poly models, staged loading, v1 slides) and removed the resolved open questions.
* **Research**: How deadlock-api.com and Statlocker are funded; full-history unlock mechanisms (bot-friend, Patreon tier, ingest tool).
* **Creation**: Round-3 [open questions](open-questions/index.md).
* **Initialization**: Created the OKF v0.2 bundle and the repo scaffolding (README, CLAUDE.md, .gitignore).
* **Creation**: Wrote the [Vision](vision.md).
* **Decision**: Recorded the seven decisions the user confirmed in interview round 1 as [ADRs 0001-0007](decisions/index.md).
* **Creation**: Recorded the nine pending round-2 questions in [open questions](open-questions/index.md), each with a recommendation.
* **Research**: Recorded the deadlock-api.com findings verified against the live API in [research](research/index.md).
* **Creation**: Started the [backlog](recommendations/backlog.md).
