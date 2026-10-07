---
type: Open Question
title: "Themed loading sequence"
description: How to design the wait while match data is fetched.
tags: [ux, audio]
status: draft
question_status: open
recommendation: "A themed loading sequence that doubles as the intro and the audio-unlock click."
raised_on: 2026-10-06
generated: { by: claude-code/claude-opus-5-5, at: 2026-10-07T00:35:00Z }
---

# Recommendation

Fetching and caching history can take a while because of the rate limits. Make the wait part of the show: a **themed loading sequence** that is also the story's **intro** and ends in the **start click** that unlocks audio ([ADR 0006](../decisions/0006-audio.md)).
