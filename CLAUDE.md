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
| A decision gets reversed | Write a new ADR. Set the old one to `status: deprecated` and add `superseded_by:`. Never delete it. |

After every change to the wiki:

- **Update the `index.md`** of every directory you touched, and the root `wiki/index.md` if you added a section. Every entry is `* [Title](path) - description`, and the description matches the concept's frontmatter `description`.
- **Add an entry to `wiki/log.md`**: newest date first, `## YYYY-MM-DD` headings, bullets that start with a bold verb (`**Creation**`, `**Update**`, `**Decision**`, `**Deprecation**`, `**Research**`).
- Commit wiki changes alongside the code they explain.

### Release notes: `CHANGELOG.md`

Any PR that changes what the app does (features, fixes, deploy or config changes users would notice) adds a line under **Unreleased** in `CHANGELOG.md`, in plain language for players. Releases happen per milestone ([ADR 0041](wiki/decisions/0041-changelog-and-releases.md)): move Unreleased into a dated version section, bump `package.json`, merge, then tag `vX.Y.Z` and publish a GitHub Release.

### OKF rules (summary of the spec as applied here)

- Every `.md` file under `wiki/` except `index.md` and `log.md` is a **concept** and **must** start with YAML frontmatter containing `type`.
- Use these frontmatter keys:
  - `type`: one of `Vision`, `Decision Record`, `Open Question`, `Reference`, `Recommendation`, `Backlog`.
  - `title` and `description`: description is one sentence.
  - `tags`.
  - `status`: `draft` | `stable` | `deprecated`.
  - `generated: { by: <actor>, at: <ISO-8601 UTC> }`: update this whenever you meaningfully change the content.
  - `sources`: list of `{ id, resource, title }` when the content derives from external material.
  - `verified`: only when content was actually checked. Add `{ by: human:paul, at: ... }` only when the user explicitly confirms the written content.
  - `stale_after`: use it on research about fast-moving things such as the API.
- Actors: agents use `<producer>/<version>` (for example `claude-code/claude-opus-5-5`), the user is `human:paul`, scripts are `process:<id>`.
- Project-specific extension keys: `decision` (`accepted` | `superseded`), `decided_on`, `superseded_by`, `question_status` (`open` | `resolved`), `recommendation`, `resolved_by`, `priority`.
- `index.md` files carry no frontmatter. The only exception is root `wiki/index.md`, which has `okf_version`.
- Links: use **relative** markdown links (`../decisions/0001-x.md`). OKF permits relative links. We avoid the spec's recommended bundle-absolute `/x.md` form because `wiki/` is a subdirectory, so absolute links would break on GitHub and in editors.
- Prefer structure (headings, tables, lists) over prose.
- File names: lowercase kebab-case. ADRs are numbered `NNNN-slug.md`.

## Environments and branches (ADR 0042)

| Environment | Branch | URL | Database |
|---|---|---|---|
| Production | `main` | https://soul-ledger.onrender.com | Neon `main` |
| Staging | `staging` | https://soul-ledger-staging.onrender.com (Google sign-in) | Neon `staging` |
| Local | any | http://localhost:3000 | Neon `dev` (`DATABASE_URL` in `.env.local`) |

Rules for agents:

- Cut feature branches from `staging` and open PRs **into `staging`**. You may merge them once CI is green.
- Validate on live staging after it deploys: `pnpm test:e2e:staging` with `STAGING_URL` and `STAGING_BYPASS_TOKEN` from `.env.local`. API calls need the `x-staging-token` header.
- Run migrations against Neon `staging` (`STAGING_DATABASE_URL` in `.env.local`) or `dev`. **Never** against `main`.
- **Never merge or push to `main`, and never change production settings or secrets.** Promote by opening a `staging` → `main` PR for the owner.

## Planned stack (accepted, see wiki/decisions/0005)

Next.js (TypeScript), React Three Fiber/drei, Framer Motion, Neon Postgres, Render.
