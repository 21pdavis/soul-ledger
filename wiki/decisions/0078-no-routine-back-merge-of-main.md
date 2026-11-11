---
type: Decision Record
title: "0078: No routine back-merge of main into staging"
description: "After a release, main is not merged back into staging; the release merge commit carries no changes, so staging only looks behind, and Update branch on the release PR covers it if GitHub ever requires it."
tags: [git, releases, workflow]
status: stable
decision: accepted
decided_on: 2026-11-11
generated: { by: claude-code/claude-sonnet-5-5, at: 2026-11-11T12:00:00Z }
sources:
  - { id: nvie, resource: "https://nvie.com/posts/a-successful-git-branching-model/", title: "A successful Git branching model (nvie's note recommending simpler flows for continuous delivery)" }
  - { id: gitlab, resource: "https://about.gitlab.com/topics/version-control/what-is-gitlab-flow/", title: "What is GitLab Flow (environment branches flow downstream only)" }
---

Refines the release steps of [ADR 0041](0041-changelog-and-releases.md) and the branch flow of [ADR 0042](0042-staging-environment.md).

# Context

After releases, agents habitually opened a history-only PR merging `main` back into `staging` (for example #98 and #102). Nobody had recorded that as a decision. Gitflow does back-merge, but its author recommends simpler flows for continuous delivery[^nvie]; environment-branch flows such as GitLab's move changes downstream only[^gitlab].

# Decision

Owner confirmed 2026-11-11:

| Topic | Decision |
|---|---|
| Back-merge | Drop it. No routine PR merging `main` into `staging` after a release |
| Why | The `staging` to `main` merge commit holds no changes, so "staging is N commits behind main" is cosmetic and doesn't block the next release PR |
| If GitHub requires up-to-date | Once branch protection (#10) is on and demands it, use the release PR's "Update branch" button then |

# Consequences

* Fewer history-only PRs and CI runs after each release.
* `staging` will show as behind `main` by the release merge commits. That is expected.

[^nvie]: nvie, "A successful Git branching model" (note recommending simpler flows for continuous delivery).
[^gitlab]: GitLab, "What is GitLab Flow" (environment branches flow downstream only).
