---
type: Recommendation
title: "M4 plan: the PR breakdown for sharing (0.4.0)"
description: "How to build M4 (slide pictures, share links, link previews and weekly cleanup) in eight PRs into staging, ending with release 0.4.0."
tags: [m4, plan, sharing]
status: draft
generated: { by: claude-code/claude-opus-5-5, at: 2026-11-11T23:00:00Z }
---

# Steps

Decisions: [ADR 0079](../decisions/0079-m4-sharing-scope.md). Anything not specified there is "decided in the build". The Hoarder [open question](../open-questions/hoarder-role-source.md) only affects squad mode (M6), so it doesn't block M4.

# 0.4.0 PR breakdown

Steps 1-7 are built and merged into staging (#115-#122); build decisions are in [ADR 0081](../decisions/0081-m4-sharing-build-decisions.md). Step 8 (release) is next.

| PR | Scope |
|---|---|
| 1. Storage (done) | Shared-stories table, migration, repository and the name-slug builder (letters and digits, about 20 characters, random fallback) |
| 2. Share API (done) | Create a snapshot on Share, reuse the link for the same story, 10 a minute per visitor ([ADR 0076](../decisions/0076-per-ip-lookup-rate-limit.md) mechanism) |
| 3. `/w/[slug]` page (done) | Frozen replay with the 3D city, shared-mode controls ("See their latest", "Look up your own"), "Shared <date> · numbers from that day" line, expired page |
| 4. Slide pictures (done) | Render each slide as a 9:16 flat design with the footer, plus the city stills per scene |
| 5. Share button UI (done) | Native share sheet on phones; download or copy link on desktop |
| 6. Link preview (done) | Wide OG image (name, main hero art, matches, main hero and rank, over the city) and page metadata |
| 7. Weekly cleanup (done) | Cleanup script deleting expired rows, plus the owner's Render cron setup (agents can't create the service) |
| 8. Release 0.4.0 | Changelog, version bump and release per [ADR 0041](../decisions/0041-changelog-and-releases.md) |

How each PR is tested, and any owner checkpoints: decided in the build. Visual work iterates on localhost first.

## Step 7 owner setup: weekly cleanup on Render

**When:** only after 0.4.0 is on `main` and production's database has been migrated. Before that, `main` has neither the script nor the shared-stories table, so the job would fail.

The cleanup script is `pnpm cleanup:shares`. It costs about $1 a month. Agents can't create Render services, so the owner adds one Cron Job (a service that runs a command on a schedule) in the Render Dashboard: New, Cron Job, connect `21pdavis/soul-ledger`.

| Setting | Value |
|---|---|
| Name | `soul-ledger-cleanup` |
| Branch | `main` |
| Language | Node |
| Region | Oregon |
| Instance Type | cheapest (Starter) |
| Schedule | `0 9 * * 1` (Mondays 09:00 UTC) |
| Build command | `npx --yes pnpm@12.9.1 install --frozen-lockfile` |
| Command | `node_modules/.bin/tsx scripts/cleanup-shared-stories.ts` (skips downloading pnpm again every run) |
| Environment | `DATABASE_URL` = the same production app login as the web service ([ADR 0067](../decisions/0067-database-logins-per-environment.md)) |

- Check it with "Trigger Run" once. The log should say `Deleted N expired shared stories.`; a failed run shows as failed in Render.
- For staging, repeat with name `soul-ledger-staging-cleanup`, branch `staging` and the staging `DATABASE_URL`. Optional: staging links expire the same way, so it only tidies test data.
- Why it isn't in `render.yaml`: the Blueprint only applies when the owner syncs it, and agents can't create services. Adding the cron there later is fine.

## Step 3 notes

- The e2e server has no database, so `/w/<slug>` specs read links from the JSON file named by `SHARED_STORY_FIXTURES` (written by `playwright.config.ts`, read in `src/lib/share/open.ts`). Never set it in a real environment.
- Link preview hook: `generateMetadata` in `src/app/w/[slug]/page.tsx` (step 6 adds the image there).
