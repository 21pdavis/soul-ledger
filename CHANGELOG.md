# Changelog

All notable changes to Soul Ledger are recorded here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). Versions follow the milestones ([ADR 0041](wiki/decisions/0041-changelog-and-releases.md)): each milestone is a minor release (M1 = 0.1.0, M2 = 0.2.0, …), fixes between milestones are patch releases, and v1 ships as 1.0.0.

## [Unreleased]

### Added

- **Hero art everywhere.** The hero art now also appears next to your signature stat and on the loading screen, not just on your main hero and roster.
- **Real hero art.** Your main hero and your roster now show the hero’s own artwork instead of initials (heroes without art still show initials). The footer also says that Valve and its properties are trademarks of Valve Corporation, and that this is a non-commercial fan project not affiliated with Valve.

### Changed

- On desktop the story is now a real vertical page: the slides are wide cards stacked down the screen, scrolling down moves to the next card, and there is breathing room above and on both sides. The progress bar runs down the right edge. Phones are unchanged.
- **You are a parry king from 40%, not 60%.** Landing 40% or more of your parries now earns the king badge; only below that are you a clown.
- **Your signature stat slide now has honorable mentions.** Under your top stat you also see your next two best stats, each with how rare it is (on very small phones, just the name and the percentage).

### Fixed

- The loading screen no longer sits blank during a slow lookup. It now says what it is doing from the first second (contacting Deadlock, how many matches are left, waiting in line when Deadlock's servers ask us to slow down). If nothing has happened for 20 seconds, it says so and offers a Try again button. Looking up a player is also a little faster, because the profile and match list are asked for together.

### Removed

- The death slide no longer ends with the "souls that never made it to the shop" line. The stat behind it was unclear, so it is dropped.

## [0.2.0] - 2026-10-08

**Milestone M2: the playable 2D story.** The 11-slide story now plays on phone and desktop, with placeholder art. The 3D world arrives in M3.

### Added

- **Paste your Steam profile link and get your story.** The home page asks for your Steam profile URL (no login needed) and remembers it for next time.
- **All time or This patch.** Choose whether the story covers your whole history or only matches since the latest patch. The story says which one you are looking at, and "Based on N matches" shows how many games it counts.
- **A loading screen that shows real progress.** While your ledger is being built you see your Steam name and avatar, then your match count with the heroes you have played, then a live tally of matches read, kills and crates smashed. It follows what is actually happening instead of a fake timer and says so when it is waiting its turn. Each step stays on screen long enough to read, the counters count up at a readable pace, and the story waits a beat after the last step, but a slow lookup is not made any slower.
- **The 11-slide story.** Your hours and matches, your main hero and how you rank on it, your roster, your Scavenger stats (Crate Goblin, Gambler, and Urn Mule with the urns you returned), how you kill, your precision and parries, Mid Boss, where you like to die (a heatmap of your deaths), your rank climb, and your signature stat. It plays with placeholder art, and players with only a few matches still get a story, just without the same-hero rankings.
- **Play it your way.** On a phone, tap the right side of the screen to go forward and the left to go back (press and hold to pause). On desktop, scroll through the story, or use the arrow keys, space or the progress bar.
- **A summary card to finish.** The last slide gathers your headline numbers. Replay the story, Refresh to fetch your latest matches, or look up another player.
- **Friendly problem screens.** If your profile can't be found (check that it's public), the service is down (try again in a minute), the connection drops, or you have no Deadlock matches yet (or none since the latest patch), you get a clear full-screen message with what to do next instead of an error code.
- **Easier to use for everyone.** The whole site works with the keyboard alone and shows where the keyboard is, text meets contrast guidelines, screen readers announce each slide as you move through the story, and animations are skipped if your device asks for reduced motion.
- **Every slide now fits small phones.** On a small screen the rank climb no longer runs off the bottom (your current rank is always fully on screen: a long climb shows fewer rows instead), and the other slides tighten up the same way for long hero names and big numbers.
- **Pressing Enter too early no longer wipes your link.** The profile field and the button wait until the page has finished loading before they can be used, so a fast Enter can't reload the page and lose what you typed.
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

[Unreleased]: https://github.com/21pdavis/soul-ledger/compare/v0.2.0...HEAD
[0.2.0]: https://github.com/21pdavis/soul-ledger/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/21pdavis/soul-ledger/releases/tag/v0.1.0
