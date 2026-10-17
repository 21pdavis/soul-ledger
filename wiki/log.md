# Directory Update Log

## 2026-10-17
* **Decision**: [ADR 0075](decisions/0075-per-ip-lookup-rate-limit.md): `/api/lookup` is limited to 10 lookups a minute per client IP, in memory, with 429 and Retry-After; staging-key holders are exempt. Fixes #7; the cross-instance part joins #16.
* **Research**: [Client IP behind Render's proxy](research/render-client-ip.md): first `x-forwarded-for` entry, with a spoofing caveat; not yet verified against Render.

## 2026-10-16
* **Decision**: [ADR 0074](decisions/0074-no-ci-run-on-staging-pushes.md): CI no longer runs on pushes to staging (the up-to-date PR run already covers it), and a new commit on a PR cancels its older run. Amends ADR 0063 (owner decision).
* **Milestone**: release 0.3.1 prepared: the city behind the landing page ([ADR 0073](decisions/0073-city-behind-the-landing-page.md), #95), a patch release per [ADR 0068](decisions/0068-m3-scope-and-order.md).

## 2026-10-15
* **Decision**: [ADR 0073](decisions/0073-city-behind-the-landing-page.md): the 3D city now sits behind the landing, loading and error screens as scenery, amending the load-after-the-story-starts rule of ADRs 0068 and 0069 (owner request).
* **Decision**: [ADR 0072](decisions/0072-concise-reviews-one-thread-per-finding.md): agent reviews list problems only, one comment per finding with inline suggested changes; a re-review waits until every thread is resolved or marked blocked (rare).
* **Decision**: [ADR 0071](decisions/0071-remember-auto-drop-but-never-save-off.md): an automatic graphics drop to Simple is remembered on the device, a drop to Off lasts only for the visit, and Off is only saved by the reader's choice. Resolves the [auto-drop question](open-questions/auto-drop-memory.md); the code already did this.
* **Milestone**: [M3 plan](recommendations/m3-plan.md): the cube graphics button (#79) and the sharper Off still (#86) are in `staging` and ship in release 0.3.0, not a 0.3.1 (owner decision).
* **Decision**: [0070](decisions/0070-graphics-button-is-a-corner-icon.md): the graphics button becomes a cube icon in the screen's bottom-right corner, outside the story frame (#79).

## 2026-10-14
* **Milestone**: [M3 plan](recommendations/m3-plan.md): 0.3.0 build is mostly in `staging` (world foundation #73, framing #74, graphics levels #75, real nemesis duels #76, auto-drop #77, hero cut-outs #80). Pending: the phone placement of the graphics button (#79, awaiting an owner design decision).
* **Creation**: [Auto-drop memory](open-questions/auto-drop-memory.md): open question on whether an automatic graphics drop is remembered on the device.
* **Research**: [Match metadata fields](research/match-metadata-fields.md) now records the killer slot in `death_details`, how it maps to a hero through the match lineup, and that the lineup needs a second slim API call.

## 2026-10-11
* **Decision**: [ADR 0069](decisions/0069-m3-city-tour-and-hero-cards.md): the M3 world is a static low-poly City Never Sleeps tour (Yellow to Blue to Green, level weaving camera, projected death map, sewer mid boss), and heroes stay art cards for 0.3.0 because code-sculpted models fell short. Resolves the [model style question](open-questions/m3-model-style.md); supersedes parts of ADRs 0068 and 0025.
* **Creation**: [M3 model style](open-questions/m3-model-style.md): open question on faceted blocks (ADR 0025) versus the sculpted low-poly look the owner asked for on the mid boss.
* **Research**: [The Cursed Apple map after City Never Sleeps](research/cursed-apple-map.md): the post-update layout, lane stops, bridges, Guardians, mid boss pit and look, as reference for the M3 low-poly city preview.
* **Decision**: [ADR 0068](decisions/0068-m3-scope-and-order.md): M3 settled in a grilling session: a story-following low-poly Deadlock world, art cards for every hero, nemesis duels, Full/Simple/Off graphics with an auto-drop below 20 fps, and low-poly posed models starting with a three-hero checkpoint before the rest of 0.3.0. Supersedes parts of ADRs 0013, 0019 and 0028.
* **Creation**: [M3 plan](recommendations/m3-plan.md): four owner-gated steps and a draft 0.3.0 PR breakdown.
* **Decision**: [ADR 0063](decisions/0063-two-depth-ci.md) amended: CI runs as three parallel jobs (checks, e2e phone, e2e desktop) with build and browser caches, same tests as before. Required checks under #10 must name all three.
* **Decision**: [ADR 0067](decisions/0067-database-logins-per-environment.md): production and staging now connect as a limited `soul_ledger_app` login (rows only), and the production owner password was reset and lives only in the owner's password manager. Closes #8 and #9.

## 2026-10-09
* **Decision**: [ADR 0066](decisions/0066-death-map-on-roast-slide.md): the roast slide’s death heatmap is drawn on a stylised Deadlock map on a finer grid (supersedes the "no map" part of ADR 0053).
* **Decision**: [ADR 0063](decisions/0063-two-depth-ci.md): CI runs a smoke browser set on PRs into `staging` and the full suite with coverage only on the `staging` to `main` PR and pushes to `main`. Prompted by 11 to 12 minute CI runs.

## 2026-10-08
* **Decision**: [ADR 0065](decisions/0065-hero-art-served-locally.md): the owner approved deadlock-api hero images, served from downloaded copies on hero tiles, staging included (supersedes the no-Valve-art parts of ADRs 0051 and 0053 for hero images only); the monogram stays as fallback. Closes the [hero art question](open-questions/m2-hero-art-terms.md).
* **Decision**: [ADR 0064](decisions/0064-recent-win-rates.md): main and roster slides show a recent win rate (latest 300 matches overall, latest 20 per hero) beside all-time, with an arrow at a 3-point gap.
* **Research**: [Valve match files and the Steam cache](research/valve-match-files-and-steam-cache.md): a local experiment showed match files can be downloaded from Valve with a match ID and salt from Steam's cache, but the cache holds only recent matches (5 in the owner's), so it can't give full history. The owner scrapped the feature; terms of use unknown.
* **Decision**: [ADR 0062](decisions/0062-desktop-vertical-card-stack.md): the desktop story becomes a vertical stack of wide cards with a vertical progress rail, replacing the pinned 9:16 column (refines ADR 0050; phone unchanged).
* **Decision**: [ADR 0061](decisions/0061-parry-king-at-40-percent.md): the owner lowered the parry-king line to 40% (a 40%-or-better parrier is not a clown), superseding the parry row of ADR 0040.
* **Decision**: [ADR 0014](decisions/0014-staged-loading.md) amended: the loader also gets `status` events (contacting, batch left, rate-limit wait, finishing), a note that is never empty, and a 20 s stall message with a retry. A lookup that sat on a blank screen for over a minute was silent between the history event and the first details batch, with no sign of rate-limit waits.
* **Decision**: [ADR 0060](decisions/0060-owner-decisions-m2-open-questions.md): the owner closed the four M2 open questions: keep Limelight and Space Grotesk, accept the rank tier names, allow deadlock-api hero art with a not-affiliated-with-Valve disclaimer (risk noted, fan content policy unread), and drop the unspent-souls stat (supersedes parts of ADRs 0015, 0053, 0055). New open question: [source for the Hoarder role](open-questions/hoarder-role-source.md).
* **Decision**: [ADR 0059](decisions/0059-claude-posts-as-github-app-bot.md) amended on the owner's say-so: the GitHub App bot is for `reviewer` and `qa` output only (PRs, implementer replies, orchestrator comments, merges and pushes stay under the owner's name), and deny rules now block agents from reading the bot's `.pem` key.
* **Decision**: [ADR 0059](decisions/0059-claude-posts-as-github-app-bot.md): reviewer and QA agents post comments and issues as the "Soul Ledger Claude" GitHub App via `pnpm bot:gh` (read-only contents, one-hour tokens, key outside the repo). Open: whether a bot Approve counts for required reviews (test once #10 exists); a deny rule on reading the `.pem` needs owner approval.
* **Decision**: [ADR 0055](decisions/0055-owner-confirmations-after-m2.md), owner confirmations after M2: rank tier names and the Limelight and Space Grotesk fonts confirmed (their open questions are resolved), the Scavenger caption becomes "urns returned", and no unspent-souls number for now (#36 and its open question stay open). The hero art question stays open, rewritten in plain language.
* **Decision**: [ADR 0058](decisions/0058-contact-maintainers-and-respect-rate-limits.md): contact the deadlock-api maintainers before launch (reverses the deferral in ADR 0017), never evade their per-IP rate limits, and don't self-host a clone of the API (it can't fix the coverage gap).
* **Research**: [deadlock-api](research/deadlock-api.md) now lists `/v1/players/hero-stats` (public, 100 req/s, computed from stored matches, so same partial history) and clarifies that `account-stats` is Valve's own in-game data but Patreon-only. Cold-lookup capacity from one IP is about 200 to 250 an hour.
* **Research**: The [ingest-cache page](open-questions/full-history-unlock.md) offers a background tool that also backfills a few missing matches a day, and a one-time browser upload of the Steam cache (match IDs only). The unlock screen should link it.
* **Decision**: [ADR 0056](decisions/0056-loader-pacing.md): the staged loader now holds each real stage for a minimum dwell (1.6 s), counters count up over at least 1.2 s and the story waits a 1 s tail, so it can be read; real events still gate every stage and a timer never advances one. Pacing can be switched off for tests via a runtime override.
* **Decision**: [ADR 0057](decisions/0057-token-efficient-unattended-runs.md): token-efficiency policies for unattended runs (context hygiene, fresh narrow agents, short briefs, bounded fix loops, targeted e2e, foundation first, fewer bigger PRs, orchestrator-watched CI, measure per milestone), prompted by M2 using about two 5-hour windows. The owner also decided the reviewer moves to Sonnet at high effort, with Opus only for xhigh work (auth, data integrity, migrations, security); this amends the reviewer row of [ADR 0049](decisions/0049-agent-model-assignment.md).
* **Milestone**: **M2, the playable 2D story**, is built and merged into `staging` (#26-#35, #31, #39): entry screen with an All time / This patch control, staged loading, 11 slides, summary card, error states, and axe, keyboard and reduced-motion tests. See the [M2 plan](recommendations/m2-plan.md) outcome for deviations. Still open for the owner: [font pairing](open-questions/m2-font-pairing.md), [rank tier names](open-questions/m2-rank-tier-names.md), [hero art terms](open-questions/m2-hero-art-terms.md), [unspent souls unit](open-questions/m2-unspent-souls-unit.md). The repo going public still waits on #8 and #9.
* **Research**: "Unspent Gold Minutes" fits souls × minutes in the recorded bulk metadata (every value exceeds the match length in minutes; value per minute stays below net worth). 26 of 351 Normal records lack the key and are stored as 0, which understates the average. The roast slide ships a neutral sentence for now; the [open question](open-questions/m2-unspent-souls-unit.md) stays open until the owner accepts the inference (#36).
* **Decision**: Audio-unlock on the entry Enter click is deferred out of M2 (no audio layer exists; music is a P2 backlog item). [ADR 0052](decisions/0052-m2-entry-loading-error-states.md), the [M2 plan](recommendations/m2-plan.md) and the [backlog](recommendations/backlog.md) say so.

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
