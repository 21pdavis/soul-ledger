---
type: Decision Record
title: "0032: Private GitHub repo now, CI on every push, public at M2"
description: The repo lives on GitHub (21pdavis/soul-ledger), private until milestone M2, with GitHub Actions running all tests on every push.
tags: [repo, ci]
status: stable
decision: accepted
decided_on: 2026-10-06
generated: { by: claude-code/claude-opus-5-5, at: 2026-10-07T01:30:00Z }
---

# Decision

- **Repo:** `21pdavis/soul-ledger` on GitHub, **private** until milestone M2 ([ADR 0028](0028-milestones.md)), then public under AGPL-3.0 ([ADR 0024](0024-license-agpl.md)).
- **CI:** GitHub Actions runs the full test suite (unit, integration, e2e) on every push. This enforces [ADR 0029](0029-testing-tdd.md).
