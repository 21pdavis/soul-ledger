# Deadlock Wrapped (working name)

A "Spotify Wrapped"-style stat tracker for Valve's **Deadlock**. Paste a Steam profile URL or ID and get an animated, full-screen story: win rates and main heroes, plus the fun stuff (crates smashed, Sinner's Sacrifice gambles, urns run home), each ranked against other players. Three.js visuals, 1920s-occult-jazz music, mostly hype with a roast or two. Afterwards, a dashboard to explore, a shareable export, and a squad mode to compare friends.

**Status:** pre-code. The design is still being decided.

## Knowledge base

Everything we know and have decided lives in [`wiki/`](wiki/index.md). It is an [Open Knowledge Format](https://github.com/GoogleCloudPlatform/open-knowledge-format/blob/main/SPEC.md) (OKF v0.2) bundle:

- [Vision](wiki/vision.md)
- [Decisions (ADRs)](wiki/decisions/index.md)
- [Open questions](wiki/open-questions/index.md)
- [Data-source research](wiki/research/index.md)
- [Recommendations and backlog](wiki/recommendations/index.md)
- [Change log](wiki/log.md)

Agents: read [`CLAUDE.md`](CLAUDE.md) before working.

## Planned stack

Next.js (TypeScript), React Three Fiber + drei, Framer Motion, Neon Postgres, deployed on Render. Data from [deadlock-api.com](https://deadlock-api.com).

## Disclaimer

Non-commercial fan project. Not affiliated with or endorsed by Valve. Deadlock is a trademark of Valve Corporation.
