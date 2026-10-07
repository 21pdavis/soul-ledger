---
type: Open Question
title: "Monetization and open source"
description: Research on how peer sites fund themselves; resolved by ADR 0016, kept as reference.
tags: [legal, business]
status: draft
question_status: resolved
resolved_by: ../decisions/0016-open-source-patreon.md
recommendation: "Open source plus Patreon/Ko-fi for hosting and API costs; no ads, no paywalled stats."
raised_on: 2026-10-06
generated: { by: claude-code/claude-opus-5-5, at: 2026-10-06T12:00:00Z }
---

# Context

The user wants Patreon and/or open source to get attention and resources.

# How peers do it (checked 2026-10-06)

- **deadlock-api.com:** "fully open source" ([github.com/deadlock-api](https://github.com/deadlock-api/)) and funded by **Patreon sponsorship**. A **$1.50/month** patron tier gives prioritized fetching for the patron's own Steam accounts. Corporate sponsors include Statlocker.GG, Blast.TV and EDL. It carries a "not endorsed by Valve" disclaimer. Source: https://deadlock-api.com
- **Statlocker.gg:** free, with no premium tier or ads found. Distributed via an Overwolf companion app (auto match upload, clips, lobby scouting). It sponsors deadlock-api and states it is "not affiliated with Valve". Sources: https://statlocker.gg, https://senseos.gg/alternatives/statlocker-deadlock/

# Recommendation

Open source plus Patreon/Ko-fi; no ads and no paywalled stats. Add a "not affiliated with Valve" disclaimer.
