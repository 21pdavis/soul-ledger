# Changelog

All notable changes to Soul Ledger are recorded here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). Versions follow the milestones ([ADR 0041](wiki/decisions/0041-changelog-and-releases.md)): each milestone is a minor release (M1 = 0.1.0, M2 = 0.2.0, …), fixes between milestones are patch releases, and v1 ships as 1.0.0.

## [Unreleased]

### Fixed

- The "Showing cached matches" note now floats over the top of the story instead of shrinking it on small phones, and you can still dismiss it.

## [0.3.1] - 2026-10-16

**The city on the front page.** The 3D city from 0.3.0 now greets you before your story starts, too.

### Added

- The front page now has the city behind it too, slowly circling from above while you paste your profile, and it stays there while your ledger loads. It follows the same graphics setting as the story (the cube button in the corner works here too).

## [0.3.0] - 2026-10-15

**Milestone M3: the city behind the story.** A low-poly copy of the Cursed Apple now sits behind your story, and the camera tours it slide by slide. Heroes stand in the city as cut-out cards placed from your stats, and the duel shows your real nemesis. Posed 3D hero models come later.

### Added

- The duel in the city now shows the hero that has killed you the most, not a stand-in rival. For players already looked up, the next refresh fills in who killed them in past games; the real rival appears once most of their deaths are known, and until then the old pairing shows.
- A low-poly copy of the Cursed Apple now sits behind your story. Devices that can't show 3D, and anyone who prefers reduced motion, see a still picture of the city instead.
- A small cube button in the bottom-right corner of the screen switches the city between Full, Simple (lighter on slower phones and laptops) and Off (a still picture). On a computer, hover over it to see the current level. It changes right away without restarting the story, and your choice is remembered on that device. Slower devices now start on Simple.
- If the city runs too slowly for a few seconds, it now steps down a graphics level by itself (Full to Simple, Simple to Off) and shows a brief note. It never goes back up on its own, stops once you pick a level yourself, and a drop to Simple is remembered on that device (a drop to Off lasts only for that visit).
- Your heroes stand in the city as cut-out cards: your main beside you, your most-played heroes around the map, placed from your stats.
- On desktop the story cards are slimmer and step left and right, leaving room for the city beside them.
- The "how you kill" card now names your nemesis, the hero that has killed you the most, with their picture and how many times, so the duel in the city behind it makes sense. It shows at every graphics level, and stays hidden until we really know who your nemesis is.

### Fixed

- Heroes in the city whose art we don't have yet (new heroes from a patch) now stand as a plain grey silhouette instead of failing to load. A hero repeated in your top heroes no longer stands twice in the line-up, and a story with an empty top-heroes list still shows your main.
- On phones, tapping to open the final summary no longer also presses the Replay or Look up another player button underneath your finger.
- On shorter phones the top edge of the story frame is no longer cut off.
- With graphics turned Off (from the cube button), the still picture of the city is now sharp on large and high-resolution screens instead of blurry.
- On the smallest phones the roster slide no longer spills past the bottom of the card: when the list of top heroes cannot fit, the recent-form lines are left out.

## [0.2.0] - 2026-10-11

**Milestone M2: the playable 2D story.** The 11-slide story now plays on phone and desktop, with real hero artwork. The 3D world arrives in M3.

### Added

- **Paste your Steam profile link and get your story.** The home page asks for your Steam profile URL (no login needed) and remembers it for next time.
- **All time or This patch.** Choose whether the story covers your whole history or only matches since the latest patch. The story says which one you are looking at, and "Based on N matches" shows how many games it counts.
- **A loading screen that shows real progress.** While your ledger is being built you see your Steam name and avatar, then your match count with the heroes you have played, then a live tally of matches read, kills and crates smashed. It follows what is actually happening instead of a fake timer: from the first second it says what it is doing (contacting Deadlock, how many matches are left, waiting in line when Deadlock's servers ask us to slow down), and if nothing has happened for 20 seconds it says so and offers a Try again button. Each step stays on screen long enough to read, the counters count up at a readable pace, but a slow lookup is not made any slower, and asking for your profile and match list together makes lookups a little faster.
- **The 11-slide story.** Your hours and matches, your main hero and how you rank on it, your roster, your Scavenger stats (Crate Goblin, Gambler, and Urn Mule with the urns you returned), how you kill, your precision and parries (you are a parry king from 40%), Mid Boss, where you like to die (a heatmap of your deaths on a map of the lanes), your rank climb, and your signature stat with two honorable mentions. Players with only a few matches still get a story, just without the same-hero rankings.
- **Your recent form next to your all-time win rate.** The main hero and roster slides show your win rate over your last 300 matches (last 20 per hero) beside the all-time number, with an arrow when you have moved 3 points or more.
- **Real hero art.** Your main hero, roster, signature stat and the loading screen show the hero's own artwork (heroes without art show initials). The footer says that Valve and its properties are trademarks of Valve Corporation, and that this is a non-commercial fan project not affiliated with Valve.
- **Play it your way.** On a phone, tap the right side of the screen to go forward and the left to go back (press and hold to pause). On desktop the story is a vertical page of wide cards: scroll down, or use the arrow keys, space or the progress bar down the right edge.
- **A summary card to finish.** The last slide gathers your headline numbers and your hero pool (your five most-played heroes with their win rates). Replay the story, Refresh to fetch your latest matches, or look up another player.
- **Friendly problem screens.** If your profile can't be found (check that it's public), the service is down (try again in a minute), the connection drops, or you have no Deadlock matches yet (or none since the latest patch), you get a clear full-screen message with what to do next instead of an error code.
- **Easier to use for everyone.** The whole site works with the keyboard alone and shows where the keyboard is, text meets contrast guidelines, screen readers announce each slide as you move through the story, and animations are skipped if your device asks for reduced motion.
- **Every slide fits small phones.** On a small screen the rank climb never runs off the bottom (a long climb shows fewer rows instead), and the other slides tighten up the same way for long hero names and big numbers.
- **Pressing Enter too early no longer wipes your link.** The profile field and the button wait until the page has finished loading.
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

[Unreleased]: https://github.com/21pdavis/soul-ledger/compare/v0.3.1...HEAD
[0.3.1]: https://github.com/21pdavis/soul-ledger/compare/v0.3.0...v0.3.1
[0.3.0]: https://github.com/21pdavis/soul-ledger/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/21pdavis/soul-ledger/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/21pdavis/soul-ledger/releases/tag/v0.1.0
