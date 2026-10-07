# Accepted decisions

* [0001: Public site from day one, cached in our own Postgres](0001-public-site-postgres-cache.md) - The site is public at launch and every player lookup is cached in our Postgres so each match is fetched from the API only once.
* [0002: Identify players by Steam URL/ID with no login, plus a squad mode](0002-steam-id-no-login.md) - Players paste a Steam profile URL or ID with no login, Steam OpenID may come later, and friends can load each other into a squad comparison.
* [0003: Linear Wrapped story first, then a dashboard hub; story must be shareable](0003-story-then-dashboard.md) - The experience is a linear Wrapped story followed by an explorable dashboard, and the story must be exportable and shareable.
* [0004: All-time by default, with a this-patch toggle](0004-time-window.md) - Stats default to the player's all-time history, with a toggle to show only the current patch.
* [0005: Stack is Next.js + R3F/drei + Framer Motion + Neon Postgres on Render](0005-stack.md) - The app is built with Next.js (TypeScript), React Three Fiber/drei and Framer Motion, stores data in Neon Postgres, and deploys on Render.
* [0006: Royalty-free or commissioned occult-jazz music, synthesized stingers, muted until click](0006-audio.md) - Music is royalty-free or commissioned 1920s-occult-jazz, UI stingers are synthesized with Web Audio, audio stays muted until a start-splash click, and Valve audio is never used.
* [0007: Tone is mostly hype with a roast slide or two](0007-tone-hype-with-roasts.md) - Copy and slides are celebratory by default, with one or two playful roast slides.
