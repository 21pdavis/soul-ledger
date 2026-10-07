---
type: Decision Record
title: "0036: A one-trick plays their main in at least 60% of matches"
description: The roster slide labels a player a one-trick when their most-played hero accounts for 60% or more of counted matches, otherwise flex.
tags: [stats, slides]
status: deprecated
decision: superseded
superseded_by: 0038-one-trick-threshold-50.md
decided_on: 2026-10-06
generated: { by: claude-code/claude-opus-5-5, at: 2026-10-07T05:30:00Z }
sources:
  - id: gfinity
    resource: https://www.gfinityesports.com/league-of-legends/league-of-legends-what-is-one-trick-pony/
    title: "League of Legends: What Is One-Trick Pony?"
  - id: meinmmo
    resource: https://mein-mmo.de/en/lol-what-does-otp-mean-and-who-does-it-apply-to,676267
    title: "LoL: What does OTP mean and who does it apply to?"
  - id: blizzard
    resource: https://us.forums.blizzard.com/en/overwatch/t/what-is-otp-and-what-isnt/376258
    title: "Overwatch forums: What is OTP and what isn't?"
---

> **Superseded** by [ADR 0038](0038-one-trick-threshold-50.md), which lowers the line to 50%.

# Decision

- **One-trick:** the main hero's share of counted matches is **at least 60%**. Otherwise the player is **flex**. Used by the roster slide ([ADR 0015](0015-v1-slides.md), slide 3).
- The threshold is the user's call. It replaces M1's provisional 40%.

# Background

Searches of League of Legends and Overwatch sources (2026-10-06) found **no established numeric threshold**.

- Communities define a one-trick, or OTP, qualitatively: someone who "only" or "mainly" plays one character.[^gfinity][^meinmmo]
- Overwatch players describe an OTP as someone who won't switch heroes whatever the situation, and propose no percentage.[^blizzard]

[^gfinity]: "League of Legends: What Is One-Trick Pony?"
[^meinmmo]: "LoL: What does OTP mean and who does it apply to?"
[^blizzard]: "Overwatch forums: What is OTP and what isn't?"
