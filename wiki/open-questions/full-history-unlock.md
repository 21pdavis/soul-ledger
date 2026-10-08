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

# Findings (2026-10-08): the ingest-cache page

Source: https://deadlock-api.com/ingest-cache ("Get your matches on Deadlock trackers").

- Trackers can only show matches someone has sent in, because a match needs its ID **and a salt** that the game client downloads through Steam when it shows the match.
- **Two free routes for a player:**
  - **Background tool** (Windows, Linux, Docker): sends every new match as it loads, plus everything already in the Steam cache. While Deadlock is closed it also uses the player's Steam session to **fetch a few still-missing matches a day**, so coverage can grow over time. It sends match IDs and the public Steam ID only, never the Steam login.
  - **One-time cache upload** in the browser: the player drops their Steam `appcache/httpcache` folder on the page. The browser reads it and sends only match IDs. It covers only what is in the cache (recent matches), and nothing afterwards.
- This corrects the earlier note that the ingest tool only fills in recent cached matches: the background tool also backfills slowly.
- Salts are also exposed as `GET /v1/matches/{match_id}/salts` (100 req/s from the DB, 10 req/30 min from Steam) and ingested via `POST /v1/matches/salts`. We have no use for them yet.
- **Implication:** the free route to fuller history is the player's own machine, not our server. Our unlock screen should link this page rather than rebuild it, and ask the maintainers about deeper integration ([ADR 0058](../decisions/0058-contact-maintainers-and-respect-rate-limits.md)).

# Next step

Ask the deadlock-api maintainers (Discord/GitHub) how a third-party site should guide users through the bot-friend flow, and whether an API key or sponsorship raises our limits.
