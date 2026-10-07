---
type: Open Question
title: "How players unlock full match history"
description: "Findings on bot-friend, the Patreon tier and the ingest tool; dev approach decided in ADR 0017; outreach deferred."
tags: [data, api]
status: draft
question_status: resolved
resolved_by: ../decisions/0017-full-history-via-patreon-for-now.md
recommendation: "Ask the deadlock-api maintainers how third-party sites should use the bot-friend flow; meanwhile link the ingest tool and Patreon tier."
raised_on: 2026-10-06
generated: { by: claude-code/claude-opus-5-5, at: 2026-10-06T12:00:00Z }
---

# Findings (2026-10-06)

- The match-history docs say full history requires the account to be **friends with one of the API's bots**. The bot-friend rate limit is 10 req/h per IP. **No public, documented free flow for friending the bot was found.** The documented route is the **$1.50/mo Patreon prioritized-account** tier ([tracker](https://deadlock-api.com/tracker)).
- **deadlock-api-ingest** (MIT, free; https://github.com/deadlock-api/deadlock-api-ingest) runs locally and submits match IDs and salts from the Steam replay cache. It fills in **recent cached** matches, not full history.

# Next step

Ask the deadlock-api maintainers (Discord/GitHub) how a third-party site should guide users through the bot-friend flow, and whether an API key or sponsorship raises our limits.
