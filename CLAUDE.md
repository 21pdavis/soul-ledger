# CLAUDE.md

Guidance for agents (Claude Code and others) working in this repo.

## Project state

**M1 (data layer) is built; M2 is next** ([milestones](wiki/decisions/0028-milestones.md)). The knowledge base under `wiki/` is the source of truth for what has been decided. Next.js-specific agent rules are in [`AGENTS.md`](AGENTS.md).

Commands: `pnpm test` (unit + integration), `pnpm test:e2e`, `pnpm typecheck`, `pnpm lint`, `pnpm format:check`, `pnpm db:generate` / `pnpm db:migrate`. Integration tests run on in-process PGlite. `.env.local` holds the Neon `dev` branch `DATABASE_URL` and is never committed.

## The knowledge base: `wiki/` (Open Knowledge Format v0.2)

`wiki/` is an OKF bundle. Spec: https://github.com/GoogleCloudPlatform/open-knowledge-format/blob/main/SPEC.md

### Before any work

1. Read `wiki/index.md`, then the `index.md` of any relevant section (progressive disclosure: indexes first, concept files second).
2. Read the decisions in `wiki/decisions/` that touch your task. Don't contradict an accepted decision. If you think one is wrong, say so and add an open question. Don't silently diverge.
3. Check `wiki/open-questions/` so you don't build on something still undecided.

### While working: record knowledge as it happens

Don't batch wiki updates to the end. When something is learned or decided, write it down:

| What happened | Where it goes |
|---|---|
| The user confirms a decision | New ADR `wiki/decisions/NNNN-short-slug.md` (next free number). If it resolves an open question, set that question to `question_status: resolved`, add `resolved_by:` linking the ADR, and keep the file. |
| A new undecided question comes up | `wiki/open-questions/short-slug.md` with `question_status: open` and a `recommendation`. |
| A fact about an external API, data or library | A concept in `wiki/research/`, with `sources` in frontmatter and footnotes keyed to `sources[].id` for specific claims. |
| An idea, improvement or future task | `wiki/recommendations/backlog.md`, or a new concept in `wiki/recommendations/` if it is large. |
| A shortcut taken, or a known gap or security weakness | A **GitHub issue** labelled `tech-debt` (plus `security`/`infra` where they fit). Issues are the source of truth; refer to them by number (#10). Rules: `wiki/recommendations/tech-debt.md`. |
| A decision gets reversed | Write a new ADR. Set the old one to `status: deprecated` and add `superseded_by:`. Never delete it. |

After changing the wiki ([ADR 0045](wiki/decisions/0045-lighter-wiki-upkeep.md)):

- **Run `pnpm check:wiki`** (CI runs it too). It catches the bookkeeping, so you don't have to remember it, and its messages say exactly what to fix:
  - frontmatter that won't parse, or lacks `type` or `description`;
  - a concept missing from its directory `index.md`, or an index description that doesn't match the frontmatter;
  - broken relative links;
  - a superseded ADR without `superseded_by`, or a resolved question without `resolved_by`;
  - log dates out of order;
  - CRLF line endings.
- **Index entries** are `* [Title](file.md) - description`, with the description copied from the frontmatter. To change the wording, change the frontmatter and copy it across.
- **Log only what a future agent needs to know happened**, under `## YYYY-MM-DD` (newest first), one bullet per item, each starting with a bold verb: `**Decision**`, `**Research**`, `**Creation**` (a new concept), `**Deprecation**` or `**Milestone**`. Skip routine edits (wording, timestamps, index tweaks, link fixes); git history has those.
- **Quote YAML values that contain `: ` or start with a quote**, e.g. `description: "Uses X: a, b."`. Otherwise the frontmatter breaks.
- Commit wiki changes alongside the code they explain.

**Where things live:** CLAUDE.md states the **operational rules**, briefly, and links the ADR. The ADR holds the **decision and its reasoning**. Don't restate an ADR's reasoning here; link to it.

### Release notes: `CHANGELOG.md`

Any PR that changes what the app does (features, fixes, deploy or config changes users would notice) adds a line under **Unreleased** in `CHANGELOG.md`, in plain language for players. Releases happen per milestone ([ADR 0041](wiki/decisions/0041-changelog-and-releases.md)): move Unreleased into a dated version section, bump `package.json`, merge, then tag `vX.Y.Z` and publish a GitHub Release.

### OKF rules (summary of the spec as applied here)

- Every `.md` file under `wiki/` except `index.md` and `log.md` is a **concept** and **must** start with YAML frontmatter containing `type`.
- Use these frontmatter keys:
  - `type`: one of `Vision`, `Decision Record`, `Open Question`, `Reference`, `Recommendation`, `Backlog`.
  - `title` and `description`: description is one sentence.
  - `tags`.
  - `status`: `draft` | `stable` | `deprecated`.
  - `generated: { by: <actor>, at: <ISO-8601 UTC> }`: update this whenever you meaningfully change the content. Description syncs and formatting fixes don't count.
  - `sources`: list of `{ id, resource, title }` when the content derives from external material.
  - `verified`: only when content was actually checked. Add `{ by: human:paul, at: ... }` only when the user explicitly confirms the written content.
  - `stale_after`: use it on research about fast-moving things such as the API.
- Actors: agents use `<producer>/<version>` (for example `claude-code/claude-opus-5-5`), the user is `human:paul`, scripts are `process:<id>`.
- Project-specific extension keys: `decision` (`accepted` | `superseded`), `decided_on`, `superseded_by`, `question_status` (`open` | `resolved`), `recommendation`, `resolved_by`, `priority`.
- `index.md` files carry no frontmatter. The only exception is root `wiki/index.md`, which has `okf_version`.
- Links: use **relative** markdown links (`../decisions/0001-x.md`). OKF permits relative links. We avoid the spec's recommended bundle-absolute `/x.md` form because `wiki/` is a subdirectory, so absolute links would break on GitHub and in editors.
- Prefer structure (headings, tables, lists) over prose.
- File names: lowercase kebab-case. ADRs are numbered `NNNN-slug.md`.

## Testing: strict TDD (ADR 0029, 0046)

Every change to app behaviour follows **red → green → refactor**. This is a rule, not a preference.

1. **Red.** Write the test first and **run it**. Watch it fail for the *expected reason*: an assertion failure or a missing export, not a typo or a broken test setup. Don't write the implementation in the same step.
2. **Green.** Write the minimum code to pass, then run the test again and see it pass.
3. **Refactor** with the suite green, then run the full suite (`pnpm test`, plus `pnpm test:e2e` when UI or routing changed).

- **Bugs:** first write a regression test that reproduces the bug and fails, then fix it.
- **Tests:** never delete, skip or weaken a test to get green without saying why in the PR.
- **PR descriptions:** list the red → green evidence for each behaviour (the failing test name and what made it pass). Reviewers, human or subagent, check that every new behaviour has a test that was seen failing first.
- **Exceptions**, which need no failing test: docs, config, generated migrations and pure wiring with no logic. Name them in the PR.

## Environments and branches (ADR 0042, 0043, 0044)

| Environment | Branch | URL | Database |
|---|---|---|---|
| Production | `main` | https://soul-ledger.onrender.com | Neon `main` |
| Staging | `staging` | https://soul-ledger-staging.onrender.com (secret access link, ADR 0043) | Neon `staging` |
| Local | any | http://localhost:3000 | Neon `dev` (`DATABASE_URL` in `.env.local`) |

Rules for agents:

- **PRs gate every change.** Never push directly to `staging` or `main`, never force-push either, and never push to a branch after its PR has merged. Every change, including one-line doc fixes, goes through a PR with green CI.
- Cut feature branches from `staging` and open PRs **into `staging`**. You may merge your own PR into `staging` only when **both** of these hold:
  1. **CI passes** on the PR's final commit.
  2. **An agent review is done.** A separate reviewer agent, not the one that wrote the change, reviews the full diff against the plan, the ADRs and the TDD rule. It posts its findings as a PR comment (`gh pr comment`), even when it finds nothing.
- **Act on agent review feedback without being asked**, as if the owner had said "go fix the feedback on this PR".
  - **Blocking** findings must be fixed. The only exception is a finding that turns on a business decision only the owner can make: ask the owner and don't merge until they answer. Never dismiss a blocking finding on your own.
  - **Non-blocking** findings and nits are fixed, or answered in a PR reply explaining why not.
  - Every fix commit needs CI to pass again before merging.
- PRs into `staging` don't need the owner's review. **`staging` → `main` always does**, and only the owner merges it.
- **Tell the owner about every merge.** Whenever you merge a PR, or notice that one was merged (including the owner's `staging` → `main`), report it in the conversation straight away: PR number and link, a one-line summary, the agent review outcome, and the CI result. During long unattended runs, also send a push notification. Don't batch merges silently into an end-of-run summary.
- Validate on live staging after it deploys: `pnpm test:e2e:staging` with `STAGING_URL` and `STAGING_ACCESS_KEY` from `.env.local`. API calls need the `x-staging-token` header.
- Run migrations against Neon `staging` (`STAGING_DATABASE_URL` in `.env.local`) or `dev`. **Never** against `main`.
- **Never merge or push to `main`, and never change production settings or secrets.** Promote by opening a `staging` → `main` PR for the owner.

## Agent roster (`.claude/agents/`)

For autonomous runs, the **main session is the orchestrator**. It splits the milestone plan into PR-sized tasks, dispatches the specialists below, merges into `staging` when the rules above allow, reports every merge, and escalates only real blockers. The specialists carry their role in their agent file; every rule in this CLAUDE.md applies to all of them.

| Agent | Does | Can't |
|---|---|---|
| `implementer` | One task → one branch (in its own worktree) → one PR into `staging`, with strict TDD | Merge, push to `staging`/`main`, touch production or secrets |
| `reviewer` | Independent review of one PR, posted as a comment with a verdict and findings | Edit, push or merge |
| `qa` | After a merge, checks live staging: e2e suites, phone and desktop screenshots, Render logs; files bug issues | Change code or settings |
| `wiki-keeper` | Brings the wiki in line with what a run built or decided, via its own PR | Edit code, or invent decisions |

**Separate writers from checkers:** an implementer never reviews its own PR, and the reviewer and QA never edit. Each agent ends with a fixed-format report, so the orchestrator can act on it.

**Flow for a milestone:**
1. The orchestrator builds the shared foundation itself.
2. Implementers work the remaining tasks in parallel batches.
3. Each PR goes to `reviewer`, then the fix loop, then CI, then the merge, then a report to the owner.
4. `qa` checks live staging after merges.
5. `wiki-keeper` runs before the final `staging` → `main` PR to the owner.

## Planned stack (accepted, see wiki/decisions/0005)

Next.js (TypeScript), React Three Fiber/drei, Framer Motion, Neon Postgres, Render.
