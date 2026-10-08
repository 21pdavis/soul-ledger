# Changelog

All notable changes to Soul Ledger are recorded here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). Versions follow the milestones ([ADR 0041](wiki/decisions/0041-changelog-and-releases.md)): each milestone is a minor release (M1 = 0.1.0, M2 = 0.2.0, …), fixes between milestones are patch releases, and v1 ships as 1.0.0.

## [Unreleased]

### Added

- **A real front door.** The home page now asks you to paste your Steam profile URL (no login needed), remembers it for next time, and lets you choose **All time** or **This patch** before you look yourself up. If something goes wrong, you get a clear full-screen message instead of an error code: profile not found (check that it's public), the service is down (try again in a minute), or no Deadlock matches found. The story itself is still a placeholder.
- **A loading screen that shows real progress.** While your ledger is being built, you now see your Steam name and avatar, then your match count with the heroes you have played, then a live tally of matches read, kills and crates smashed. It follows what is actually happening instead of a fake timer, says so when it is waiting its turn, and skips the animation if your device asks for reduced motion.
- A private **staging** site for reviewing changes before they go live. It is unlocked with a private access link and deploys from the `staging` branch with its own database. Production is unchanged and still needs no login.

## [0.1.0] - 2026-10-07

**Milestone M1: the data layer.** Live at https://soul-ledger.onrender.com. The page is a placeholder; the story UI arrives in M2.

### Added

- **Steam lookup.** Paste a Steam profile URL, vanity name, SteamID64, SteamID3, SteamID2 or account id.
- **Match cache.** A player's whole history is fetched from deadlock-api.com and cached in Postgres. Later visits fetch only new matches. Simultaneous lookups of the same player share one fetch.
- **Story stats** for every v1 slide:
  - matches and hours, win rate;
  - main hero and roster (one-trick at 50% of matches);
  - breakables, Sinner's Sacrifice jackpots and urns;
  - kill methods and ranges;
  - accuracy, headshot rate and parries (parry king at 60%);
  - Rejuvenators and steals;
  - death positions and hoarded souls;
  - rank journey.

  Street Brawl is left out.
- **Rankings.** Global percentiles from deadlock-api's player-stat distributions, also compared against players of the same main hero, plus an MVP signature stat.
- **Time windows.** All-time by default, and a "this patch" window that starts on the date in the latest changelog title.
- **`GET /api/lookup`** streams progress events (profile, match history, live counters), then the finished story.
- **Graceful fallbacks.** If a refresh fails, the cached story is served and marked stale. If the percentile service is down, the story comes without rankings.
- **Optional Steam Web API.** When `STEAM_API_KEY` is set, vanity URLs resolve through Steam's official API.
- **Hosting.** Render web service (free plan, Oregon) on Neon Postgres, with the `/api/health` check.
- **Quality.** 137 unit and integration tests on recorded real match data, end-to-end smoke tests on phone and desktop, and CI on every push.

### Fixed

- The Render build no longer installs pnpm globally, because Render's global modules folder is read-only.
- Failed Steam vanity-URL lookups are now logged with the reason. They had failed intermittently in production right after the first deploy.

[Unreleased]: https://github.com/21pdavis/soul-ledger/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/21pdavis/soul-ledger/releases/tag/v0.1.0
