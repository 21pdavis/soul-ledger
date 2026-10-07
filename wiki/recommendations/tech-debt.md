---
type: Backlog
title: Tech debt
description: Tech debt and security hardening are tracked as GitHub issues labelled tech-debt; this page only states the rules.
tags: [tech-debt, security, infra]
status: stable
generated: { by: claude-code/claude-opus-5-5, at: 2026-10-07T06:30:00Z }
---

**GitHub issues are the source of truth:** [open `tech-debt` issues](https://github.com/21pdavis/soul-ledger/issues?q=is%3Aissue%20is%3Aopen%20label%3Atech-debt). Refer to items by issue number (for example #10). This page keeps only the rules, so it can't drift from the issues.

# Rules

- Whenever a shortcut is taken or a gap is found, open an issue labelled `tech-debt`, plus `security` and/or `infra` where they fit. Say what the risk is and what the fix would be.
- **Before the repo goes public at M2** ([ADR 0032](../decisions/0032-github-private-ci.md)), every open `security` issue marked *before the repo goes public* must be fixed. Issues become public with the repo. Until then, describe security gaps plainly; afterwards, describe them in general terms and fix them before disclosing details.
