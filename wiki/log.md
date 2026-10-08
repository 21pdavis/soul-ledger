# Directory Update Log

## 2026-10-07
* **Decision**: The ADR 0004 this-patch toggle moves into M2 as an extensible window control, recorded in [ADR 0052](decisions/0052-m2-entry-loading-error-states.md) and the [M2 plan](recommendations/m2-plan.md); more detailed filters go on the backlog.
* **Decision**: M2 design, confirmed by the owner: [ADR 0050](decisions/0050-m2-story-flow-and-controllers.md) (phone tap-through and desktop snap-scroll over one slide index), [ADR 0051](decisions/0051-m2-visual-motion-styling-stack.md) (deco placeholders, Framer Motion, CSS modules, no Tailwind), [ADR 0052](decisions/0052-m2-entry-loading-error-states.md) (entry, staged loading, errors), [ADR 0053](decisions/0053-m2-copy-and-data-presentation.md) (copy and data presentation), [ADR 0054](decisions/0054-m2-testing-and-accessibility.md) (testing and a11y).
* **Creation**: [M2 plan](recommendations/m2-plan.md) with the PR breakdown and per-slide acceptance criteria, and four open questions: [hero art terms](open-questions/m2-hero-art-terms.md), [unspent souls unit](open-questions/m2-unspent-souls-unit.md), [rank tier names](open-questions/m2-rank-tier-names.md), [font pairing](open-questions/m2-font-pairing.md).
* **Decision**: [ADR 0049](decisions/0049-agent-model-assignment.md): qa agent moves to Haiku 5.5; implementer, wiki-keeper and reviewer keep their models.
* **Decision**: [ADR 0048](decisions/0048-unattended-run-guardrails.md): hard limits in `.claude/settings.json` (verified live) and an escalation procedure for unattended runs.
* **Decision**: [ADR 0047](decisions/0047-streamlined-review-and-ci.md): re-review only after blocking findings, one commit per review round, CI once per change with a docs-only fast path, and reviewer effort scaled to the change.
* **Decision**: [ADR 0046](decisions/0046-strict-red-first-tdd.md) makes strict red-first TDD mandatory, strengthening ADR 0029.
* **Decision**: [ADR 0045](decisions/0045-lighter-wiki-upkeep.md), lighter wiki upkeep. `pnpm check:wiki` (run in CI) now enforces frontmatter, index entries, links, supersession and log order; the log records only decisions, research, new concepts, deprecations and milestones. It found and fixed three pages whose YAML frontmatter did not parse.
* **Decision**: [ADR 0044](decisions/0044-pr-gated-changes-and-agent-review.md): PRs gate every change; agents merge into `staging` only after CI and an independent agent review, act on review feedback without being asked, and report every merge. Supersedes ADR 0042's merge rule. Added the `pre-public` issue label (#8, #9).
* **Update**: GitHub issues are now the source of truth for tech debt (the TD-n register is retired; new issues #15 for 2FA and #16 for a shared limiter; #10 now covers `staging` too). CLAUDE.md: PRs gate every change, with no direct or force pushes, an agent review is required before merging into `staging`, and every merge is reported to the owner.
* **Update**: CLAUDE.md now makes strict red-green-refactor TDD a rule (ADR 0029), with red-first evidence required in PRs.
* **Decision**: [ADR 0043](decisions/0043-staging-access-link.md) unlocks staging with a secret link and a 90-day signed cookie instead of Google sign-in (Auth.js removed). [ADR 0042](decisions/0042-staging-environment.md) is partly superseded.
* **Creation**: Added the [tech-debt register](recommendations/tech-debt.md) (TD-1 to TD-9) and GitHub issues #7-#13 (labels `tech-debt`, `security`, `infra`). Security items must be fixed before the repo goes public at M2.
* **Decision**: [ADR 0042](decisions/0042-staging-environment.md) adds a staging environment: a `staging` branch, the Render service `soul-ledger-staging`, the Neon branch `staging`, and Google sign-in plus a bypass token. Published the [v0.1.0 release](https://github.com/21pdavis/soul-ledger/releases/tag/v0.1.0).
* **Decision**: [ADR 0041](decisions/0041-changelog-and-releases.md) adds `CHANGELOG.md` and a GitHub Release per milestone. M1 is released as **v0.1.0**.
* **Decision**: [ADR 0040](decisions/0040-m1-implementation-choices.md) confirms the M1 implementation choices and raises the parry-king line to 60%. The [open question](open-questions/m1-implementation-choices.md) is resolved, and no open questions remain.
* **Milestone**: M1 is live at https://soul-ledger.onrender.com, running against Neon `main`.
* **Research**: Intermittent failures resolving [Steam vanity URLs](research/steam-vanity-resolution.md) from Render. Failures are now logged, and an optional `STEAM_API_KEY` switches to the official ResolveVanityURL API.

## 2026-10-06
* **Update**: First Render deploy failed: `npm install -g pnpm` hit a read-only file system. The build now runs pnpm through `npx` ([ADR 0039](decisions/0039-render-free-blueprint.md)).
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
