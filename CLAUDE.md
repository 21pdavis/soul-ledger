# CLAUDE.md

Guidance for agents (Claude Code and others) working in this repo.

## Project state

**M1 (data layer) and M2 (the playable 2D story) are built; M3 is next** ([milestones](wiki/decisions/0028-milestones.md)). The knowledge base under `wiki/` is the source of truth for what has been decided. Next.js-specific agent rules are in [`AGENTS.md`](AGENTS.md).

Commands: `pnpm test` (unit + integration), `pnpm test:e2e`, `pnpm typecheck`, `pnpm lint`, `pnpm format:check`, `pnpm db:generate` / `pnpm db:migrate`. Integration tests run on in-process PGlite. `.env.local` holds the Neon `dev` branch `DATABASE_URL` and is never committed.

## Talking to the owner

The owner doesn't read code day to day, so messages to them are in plain words:

- **Lead with what happened and why it matters.** Put any decision they need to make in its own short, labelled section.
- **Explain a technical term in a few words the first time** (and again if it hasn't come up for a while). Say "the settings file that blocks agents", not "hard-limit file".
- **Say it in words, then link the number.** PR and ADR numbers go after the plain description, never instead of it.
- **Keep test and build jargon out of the owner's messages** (red-green, hydration, e2e, container queries). It belongs in PR descriptions and agent reports.
- **Keep it short.** Give the conclusion and offer the detail.
- **When asked "what's X?", answer simply and fix the habit**, don't just define the word.

Exceptions: the owner asks for technical detail, and agents' own reports to the orchestrator.

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

## Environments and branches (ADR 0042, 0043, 0044, 0047)

| Environment | Branch | URL | Database |
|---|---|---|---|
| Production | `main` | https://soul-ledger.onrender.com | Neon `main` |
| Staging | `staging` | https://soul-ledger-staging.onrender.com (secret access link, ADR 0043) | Neon `staging` |
| Local | any | http://localhost:3000 | Neon `dev` (`DATABASE_URL` in `.env.local`) |

Rules for agents:

- **PRs gate every change.** Never push directly to `staging` or `main`, never force-push either, and never push to a branch after its PR has merged. Every change, including one-line doc fixes, goes through a PR with green CI.
- Cut feature branches from `staging` and open PRs **into `staging`**. You may merge your own PR into `staging` only when **both** of these hold:
  1. **CI passes** on the PR's final commit.
  2. **An agent review is done.** A separate reviewer agent, not the one that wrote the change, reviews the full diff against the plan, the ADRs and the TDD rule. It posts its findings as a PR comment (`pnpm bot:gh pr comment`, ADR 0059), even when it finds nothing.
- **Act on agent review feedback without being asked**, as if the owner had said "go fix the feedback on this PR".
  - **Blocking** findings must be fixed. The only exception is a finding that turns on a business decision only the owner can make: ask the owner and don't merge until they answer. Never dismiss a blocking finding on your own.
  - **Non-blocking** findings and nits are fixed, or answered in a PR reply explaining why not.
  - Fix **all findings from a review round in one commit and one push**, with one PR reply listing each fix. Every fix commit needs CI to pass again before merging.
  - **Re-review only if the review had a blocking finding or the fixes were substantial.** If only non-blocking findings and nits remained, fix them and merge once CI passes, with no extra review pass (ADR 0047).
  - **Scale reviewer effort to the change:** `medium` for docs or config only, `high` (Sonnet, the reviewer's default model) for code, `xhigh` on Opus (the orchestrator passes `model: "opus"`) for auth, data integrity, migrations or security (ADR 0057).
- PRs into `staging` don't need the owner's review. **`staging` → `main` always does**, and only the owner merges it.
- **Tell the owner about every merge.** Whenever you merge a PR, or notice that one was merged (including the owner's `staging` → `main`), report it in the conversation straight away: PR number and link, a one-line summary, the agent review outcome, and the CI result. During long unattended runs, also send a push notification. Don't batch merges silently into an end-of-run summary.
- Validate on live staging after it deploys: `pnpm test:e2e:staging` with `STAGING_URL` and `STAGING_ACCESS_KEY` from `.env.local`. API calls need the `x-staging-token` header.
- Run migrations against Neon `staging` (`STAGING_DATABASE_URL` in `.env.local`) or `dev`. **Never** against `main`.
- **Never merge or push to `main`, and never change production settings or secrets.** Promote by opening a `staging` → `main` PR for the owner.

## Unattended runs: hard limits and escalation (ADR 0048)

**Hard limits** live in `.claude/settings.json`. Deny rules beat allow rules and apply to every session and subagent:

| Denied | Examples |
|---|---|
| Pushing to `main` or `staging` (common forms, including `HEAD:`, `refs/heads/` and `--all`/`--mirror`); force-push; deleting remote branches | `git push origin staging`, `git push -f`, `git push origin :x` |
| Admin merges and repo settings changes | `gh pr merge --admin`, `gh repo edit` |
| Reading `.env.local` with the Read tool, `cat`, `head`, `tail`, `less` or PowerShell `Get-Content` | Use the exact `grep ... \| cut` exports in the agent briefs |
| Destructive Neon actions | Delete or reset branches, projects, databases, roles or snapshots; rotate credentials; apply migrations to the main branch |
| Render changes | Updating environment variables, creating services |

Routine work is pre-allowed so runs don't stall on prompts:
- `pnpm`;
- `git` on feature branches;
- `gh pr` / `run` / `issue` / `label`;
- read-only Render tools.

Running SQL on Neon, other risky Neon changes and triggering Render deploys always ask. **Always name the branch when pushing** (`git push -u origin <feature-branch>`): a bare `git push` is denied. These are pattern rules: a strong guardrail, not a guarantee. GitHub branch protection (#10) is the backstop.

**When blocked**, don't keep retrying. The orchestrator:
1. Commits work in progress to the feature branch (never to `staging` or `main`) and pushes it, so nothing is lost.
2. Writes the blocker up in the conversation:
   - what was attempted;
   - the error or the decision needed;
   - 2–3 options with a recommendation.
3. Sends a **push notification** so the owner doesn't have to watch the terminal.
4. Keeps working on tasks that don't depend on the blocker. If nothing can proceed, it stops.

**Blocked means:** the same failure survives about 3 genuinely different attempts; a product or business decision the plan and ADRs don't answer; a needed action is denied by the hard limits above; or an external service (deadlock-api, Steam, Render, Neon, GitHub) is down.

## Token budget for runs (ADR 0057)

Runs are limited by usage, so every agent follows these (reasoning and the rest of the policy in [ADR 0057](wiki/decisions/0057-token-efficient-unattended-runs.md)):

- **Hand-backs are short:** at most about 150 words to the orchestrator. Detail goes in the PR description or review comment, and reports are never pasted into other replies.
- **Fresh, narrow agents:** don't resume an agent for a small fix. Use a fresh agent given the PR number and review link, or the orchestrator for fixes of about 20 lines or fewer.
- **Briefs are short** (200 to 300 words): goal, areas, acceptance criteria (link the plan), constraints. Pass references, not pasted contents, and don't restate this file.
- **Tests are targeted:** run unit and component tests plus only the e2e spec files you touched. CI runs the full e2e suite. Filter long output (`tail`, `grep`) and never read whole logs.
- **Loops are bounded:** at most 2 fix rounds per PR. A third means the orchestrator re-plans or asks the owner.
- **Implementers don't wait for CI:** push, open or update the PR, report and stop. The orchestrator watches CI with a background `gh pr checks N --watch`, and triages a failure with a fresh Haiku agent (at most 100 words).
- **Owner:** run `/clear` between phases and milestones (agents can't), and share `/usage` at each milestone's end.
- Don't edit CLAUDE.md or agent files mid-run (it breaks the prompt cache), and keep this file under about 200 lines.

## Agent roster (`.claude/agents/`)

For autonomous runs, the **main session is the orchestrator**. It splits the milestone plan into PR-sized tasks, dispatches the specialists below, merges into `staging` when the rules above allow, reports every merge, and escalates only real blockers. The specialists carry their role in their agent file; every rule in this CLAUDE.md applies to all of them.

| Agent | Does | Can't |
|---|---|---|
| `implementer` | One task → one branch (in its own worktree) → one PR into `staging`, with strict TDD | Merge, push to `staging`/`main`, touch production or secrets |
| `reviewer` | Independent review of one PR, posted as a comment with a verdict and findings | Edit, push or merge |
| `qa` | After a merge, checks live staging: e2e suites, phone and desktop screenshots, Render logs; files bug issues | Change code or settings |
| `wiki-keeper` | Brings the wiki in line with what a run built or decided, via its own PR | Edit code, or invent decisions |

**Bot identity ([ADR 0059](wiki/decisions/0059-claude-posts-as-github-app-bot.md)):** only `reviewer` and `qa` post as the "Soul Ledger Claude" GitHub App, with `pnpm bot:gh <gh args>`. Everything else is under the owner's name with plain `gh`/`git`: PRs, implementer replies, orchestrator comments, merges and pushed commits (the bot cannot push or merge). Never read or print the bot's `.pem` key (deny rules in `.claude/settings.json`).

**Separate writers from checkers:** an implementer never reviews its own PR, and the reviewer and QA never edit. Each agent ends with a fixed-format report, so the orchestrator can act on it.

**Flow for a milestone:**
1. The orchestrator builds the shared foundation itself.
2. Implementers work the remaining tasks in parallel batches.
3. Each PR goes to `reviewer`, then the fix loop, then CI, then the merge, then a report to the owner.
4. `qa` checks live staging after merges.
5. `wiki-keeper` runs before the final `staging` → `main` PR to the owner.

## Planned stack (accepted, see wiki/decisions/0005)

Next.js (TypeScript), React Three Fiber/drei, Framer Motion, Neon Postgres, Render.
