import type { StoryWindow } from "@/lib/lookup";
import { PARRY_KING_RATE } from "@/lib/stats/story";
import {
  bestPercentile,
  formatHours,
  formatPatchDate,
  formatPercent,
  formatTopPercent,
} from "./format";
import { heroName } from "./heroes";
import type { KillType } from "./kill-shares";
import type { JourneyPoint } from "./rank-journey";
import { rankLabel } from "./ranks";
import type { StoryData } from "./types";

/**
 * All the words in the story live in this one module (ADR 0053), so copy is edited in one place.
 * Sections, in order: slide headlines, entry/loading/errors, slides 1-4, slides 5-7, slides 8-10,
 * summary. One fixed headline per slide; data-driven variants only for roast and MVP, plus the
 * plan-sanctioned branches (parry king/clown, Mid Boss with 0 claimed, not-notable rankings).
 * Tone: hype, playful, PG-13 (ADR 0007).
 */

// ==================================================================== Slide headlines
export const SLIDES = [
  { id: "intro", headline: "Welcome back to the Cursed Apple" },
  { id: "main", headline: "Your main" },
  { id: "roster", headline: "Your roster" },
  { id: "scavenger", headline: "Scavenger of the year" },
  { id: "kills", headline: "How you kill" },
  { id: "precision", headline: "Precision" },
  { id: "midBoss", headline: "Mid Boss business" },
  { id: "roast", headline: "Your favorite place to die" },
  { id: "rank", headline: "Your climb" },
  { id: "mvp", headline: "Your signature stat" },
  { id: "summary", headline: "Entered into the ledger" },
] as const;

export type SlideId = (typeof SLIDES)[number]["id"];

export const SLIDE_COUNT = SLIDES.length;

export function headlineFor(id: SlideId): string {
  return SLIDES.find((s) => s.id === id)!.headline;
}

// ============================================================ Entry, loading and errors

export const ENTRY_COPY = {
  title: "Soul Ledger",
  tagline: "Your Deadlock year, wrapped.",
  inputLabel: "Paste your Steam profile URL",
  inputPlaceholder: "steamcommunity.com/id/yourname",
  noLogin: "No login needed. We only read the match history your profile already makes public.",
  submit: "Open the ledger",
  invalidInput: "That doesn't look like a Steam profile URL.",
  disclaimer:
    "Non-commercial fan project. Not affiliated with or endorsed by Valve. Valve and its properties are trademarks of Valve Corporation.",
} as const;

const count = (n: number) => n.toLocaleString("en-US");

/**
 * The staged loader (ADR 0014, 0052). Teasers are shown as each real stage arrives; the
 * `announce*` strings are what screen readers hear, one per stage change.
 */
export const LOADING_COPY = {
  title: "Looking up your ledger...",
  /** The page's h1 while loading: not shown, it names the page for screen readers. */
  pageHeading: "Your Soul Ledger is loading",
  waiting: "Another lookup of this ledger is already running. Waiting our turn.",
  sealing: "Almost ready. Sealing the ledger.",
  /** What the server is doing right now. Always one of these is on screen, never a blank page. */
  status: {
    contacting: "Contacting Deadlock's servers...",
    reading: "Reading your match history...",
    fetching: "Fetching your match details...",
    batch: (left: number) =>
      `Reading your matches. ${count(left)} ${left === 1 ? "match" : "matches"} left.`,
    rateLimited: (seconds: number) =>
      `Waiting in line: Deadlock's servers only allow so many requests. About ${seconds} ${seconds === 1 ? "second" : "seconds"}.`,
    finishing: "Checking your rank history...",
  },
  stalled: {
    title: "This is taking longer than usual.",
    body: "Deadlock's servers are slow right now. You can keep waiting, or try again.",
    retry: "Try again",
  },
  /** Headings of the three ledger entries; the later ones show as blank lines until their stage. */
  entries: { profile: "The soul", history: "The matches", details: "The tally" },
  profileTeaser: (name: string | null) =>
    name
      ? `Found you, ${name}. Let's see what you've been up to.`
      : "Found you. Let's see what you've been up to.",
  historyTeaser: "Look at that roster. Somebody has been busy.",
  heroesLabel: "Heroes you have played",
  detailsLabel: "Match details read",
  heroesMore: (n: number) => `+${count(n)} more`,
  detailsTeaser: "Counting every kill and crate. The ledger does not round up.",
  nothingToRead: "Nothing new to read. The ledger is already up to date.",
  tally: { fetched: "Matches read", kills: "Kills", breakables: "Crates smashed" },
  announceProfile: (name: string | null) => (name ? `Found ${name}.` : "Found your profile."),
  announceDetails: "Reading your match details.",
  /** "120 matches on the books", "120 matches, 14 new to the ledger". */
  matchesSummary: (total: number, added: number) => {
    if (total === 0) return "No matches on the books yet";
    const matches = `${count(total)} ${total === 1 ? "match" : "matches"}`;
    if (added === 0) return `${matches}, all already in the ledger`;
    if (added >= total) return `${matches} on the books`;
    return `${matches}, ${count(added)} new to the ledger`;
  },
} as const;

export const STALE_NOTE = "From saved matches: we couldn't reach the latest just now.";

export const STORY_ACTIONS_COPY = {
  refresh: "Refresh",
  replay: "Replay",
  newLookup: "Look up another player",
} as const;

export type ErrorKind =
  "invalid" | "not_found" | "unavailable" | "fetch_failed" | "no_matches" | "rate_limited";

/** The rate-limit screen's sentence (ADR 0076). */
export const rateLimitedBody = (seconds: number) =>
  `Too many lookups, try again in ${seconds} ${seconds === 1 ? "second" : "seconds"}.`;

interface ErrorCopy {
  title: string;
  body: string;
  /** The seal's mark: a single character. */
  seal: string;
  /** The primary button. `retry` reruns the same lookup; `again` returns to the entry screen. */
  action: { label: string; does: "retry" | "again" };
}

export const ERROR_COPY: Record<ErrorKind, ErrorCopy> = {
  invalid: {
    title: "That link opens nothing",
    body: "Paste the link to your Steam profile, the one that looks like steamcommunity.com/id/yourname.",
    seal: "?",
    action: { label: "Try another link", does: "again" },
  },
  not_found: {
    title: "We couldn't find that profile",
    body: "Check the link, and make sure your Steam profile and game details are public. The ledger can only read what you share.",
    seal: "?",
    action: { label: "Try another profile", does: "again" },
  },
  unavailable: {
    title: "The ledger is out of ink",
    body: "Something stalled on our side or at Deadlock's. Try again in a minute.",
    seal: "!",
    action: { label: "Try again", does: "retry" },
  },
  fetch_failed: {
    title: "We lost the thread",
    body: "The connection dropped before your ledger arrived. Check your internet and try again in a minute.",
    seal: "!",
    action: { label: "Try again", does: "retry" },
  },
  rate_limited: {
    title: "The ledger needs a breather",
    // The wait is filled in by the screen (rateLimitedBody).
    body: "",
    seal: "!",
    action: { label: "Try again", does: "retry" },
  },
  no_matches: {
    title: "No Deadlock matches found",
    body: "Your ledger is blank. Play a few matchmaking games and come back.",
    seal: "0",
    action: { label: "Look up another player", does: "again" },
  },
};

/** The two extra sentences the zero-matches screen can add. */
export function noMatchesDetails(window: StoryWindow, excludedMatches: number): string[] {
  const details: string[] = [];
  if (window === "patch") {
    details.push(
      "There are no matches since the latest patch. Try All time, or play a few more games.",
    );
  }
  if (excludedMatches > 0) {
    details.push(
      `We skipped ${excludedMatches.toLocaleString("en-US")} ${excludedMatches === 1 ? "game" : "games"} in modes the ledger doesn't count, like Street Brawl.`,
    );
  }
  return details;
}

// ========================================================= Slides 1-4: intro to scavenger

type PercentileEntry = StoryData["percentiles"][number];

export const INTRO_COPY = {
  hoursUnit: "hours in the Cursed Apple",
  firstEntry: "First entry",
  latestEntry: "Latest entry",
} as const;

export const MAIN_COPY = {
  mostPlayed: "Your most-played hero",
  winRate: "win rate",
} as const;

/** Win rate over all matches vs the recent ones (ADR 0064). */
export const RECENT_COPY = {
  label: "recent",
  /** Points of difference at which an arrow shows. */
  arrowPoints: 3,
  arrow: { up: "▲", down: "▼", flat: "" },
  arrowLabel: { up: "trending up", down: "trending down", flat: "" },
  windowHint: (matches: number) => `last ${matches}`,
} as const;

export interface RecentTrend {
  direction: "up" | "down" | "flat";
  allTime: string;
  recent: string;
  arrow: string;
  /** The arrow in words, for screen readers. */
  arrowLabel: string;
  window: string;
}

export function recentTrend(
  allTimeRate: number,
  recent: { matches: number; winRate: number } | null,
): RecentTrend | null {
  if (!recent) return null;
  // Compare the percentages as printed, so an arrow never sits beside two numbers under 3 apart.
  const diff = Math.round(recent.winRate * 100) - Math.round(allTimeRate * 100);
  const direction =
    diff >= RECENT_COPY.arrowPoints ? "up" : diff <= -RECENT_COPY.arrowPoints ? "down" : "flat";
  return {
    direction,
    allTime: formatPercent(allTimeRate),
    recent: formatPercent(recent.winRate),
    arrow: RECENT_COPY.arrow[direction],
    arrowLabel: RECENT_COPY.arrowLabel[direction],
    window: RECENT_COPY.windowHint(recent.matches),
  };
}

export const ROSTER_COPY = {
  heroesPlayedUnit: (n: number) => (n === 1 ? "hero played" : "heroes played"),
  topHeroes: "Most played",
  winRate: "win rate",
  allTime: "All time",
} as const;

export const SCAVENGER_COPY = {
  crateGoblin: { title: "Crate Goblin", detail: "breakables smashed" },
  gambler: { title: "Gambler", detail: "Sinner's Sacrifice jackpots" },
  urnMule: { title: "Urn Mule", detail: "urns returned" },
} as const;

export function matchesUnit(n: number): string {
  return n === 1 ? "match" : "matches";
}

/** Intro first/last dates are ISO instants shown as the same UTC day for every viewer. */
export const formatLedgerDate = formatPatchDate;

export interface MainPercentileLine {
  /** "neutral" is the not-notable case: no ranking claim at all. */
  scope: "hero" | "global" | "neutral";
  /** "Top 12% of Infernus players", "Top 12% of all players", or neutral copy without a number. */
  text: string;
  /** The stat the ranking is for, e.g. "Kills per match". Empty for neutral copy. */
  metric: string;
}

/** A best ranking above this is "not notable" (ADR 0053): no claim, neutral copy instead. */
export const NOT_NOTABLE_ABOVE = 50;

const NEUTRAL_RANK_LINE = "Nothing here is topping the charts yet. The ledger is still filling up.";

/**
 * The main slide's percentile line. With enough main-hero matches `main.percentiles` is non-empty
 * and we rank against that hero's players (never labelled global). Below that it is empty, so we
 * fall back to the best global entry with global phrasing (no hero name), or to nothing.
 * Whichever list applies, a best entry above 50 is not notable: neutral copy, no percentile.
 */
export function mainPercentileLine(
  main: { heroId: number; percentiles: PercentileEntry[] },
  globalPercentiles: PercentileEntry[],
): MainPercentileLine | null {
  const heroBest = bestPercentile(main.percentiles);
  if (heroBest && heroBest.topPercent > NOT_NOTABLE_ABOVE) return neutralLine();
  if (heroBest) {
    return {
      scope: "hero",
      text: `Top ${formatTopPercent(heroBest.topPercent)}% of ${heroName(main.heroId)} players`,
      metric: heroBest.label,
    };
  }
  const globalBest = bestPercentile(globalPercentiles);
  if (globalBest && globalBest.topPercent > NOT_NOTABLE_ABOVE) return neutralLine();
  if (globalBest) {
    return {
      scope: "global",
      text: `Top ${formatTopPercent(globalBest.topPercent)}% of all players`,
      metric: globalBest.label,
    };
  }
  return null;
}

function neutralLine(): MainPercentileLine {
  return { scope: "neutral", text: NEUTRAL_RANK_LINE, metric: "" };
}

/** The roster verdict (ADR 0038): one-trick at 50% or more on the main, flex otherwise. */
export function rosterVerdict(label: "one-trick" | "flex"): { title: string; blurb: string } {
  return label === "one-trick"
    ? { title: "One-trick", blurb: "Half your matches or more go to one hero. Commitment." }
    : { title: "Flex", blurb: "No single hero owns you. You play the whole bench." };
}

// ====================================================== Slides 5-7: kills to Mid Boss

type Precision = StoryData["precision"];
type MidBoss = StoryData["midBoss"];

// ---- Slide 5: How you kill ------------------------------------------------------------------

export const KILLS_COPY = {
  /** The one fixed line for this slide (ADR 0053: data-driven variants only on roast and MVP). */
  line: "Every takedown, entered in the ledger.",
  types: {
    bullet: "Bullets",
    // Headshots are a subset of bullet kills, so the row says so.
    headshot: "of which headshots",
    ability: "Abilities",
    melee: "Melee",
  } satisfies Record<KillType, string>,
  rangeHeading: "Range",
  closeup: "Close-up",
  longDistance: "Long-distance",
  /** Names the hero dueling the reader's main in the city behind the card (ADR 0068). */
  nemesis: "Your nemesis",
} as const;

/** How often the nemesis killed the reader, so one kill never reads "1 times". */
export function nemesisKillsLine(kills: number): string {
  return kills === 1 ? "killed you once" : `killed you ${kills.toLocaleString("en-US")} times`;
}

/** The label under the kill total, so one kill never reads "1 kills". */
export function killsTotalLabel(total: number): string {
  return total === 1 ? "kill on the ledger" : "kills on the ledger";
}

// ---- Slide 6: Precision ---------------------------------------------------------------------

export const PRECISION_COPY = {
  accuracy: "Accuracy against heroes",
  headshotRate: "Headshot rate",
  parryHeading: "Parries",
} as const;

/** The king line, built from the live threshold so the copy and the label can't drift (ADR 0040). */
export function parryKingLine(): string {
  return `Parry king starts at ${Math.round(PARRY_KING_RATE * 100)}% of parries landed.`;
}

export interface ParryCopy {
  /** The stamped badge, or null when there is nothing to stamp. */
  badge: string | null;
  line: string;
  /** "30 landed, 20 missed"; null when the label is none. */
  detail: string | null;
}

export function parryCopy(p: Precision): ParryCopy {
  const detail = `${p.parrySuccess} landed, ${p.parryMiss} missed`;
  switch (p.parryLabel) {
    case "king":
      return { badge: "Parry king", line: "They swing, you answer. Crisp.", detail };
    case "clown":
      return {
        badge: "Parry clown",
        line: "Bold of you to keep trying. The timing is a work in progress.",
        detail,
      };
    default:
      return { badge: null, line: "No parries landed in this window.", detail: null };
  }
}

// ---- Slide 7: Mid Boss ----------------------------------------------------------------------

export interface MidBossCopy {
  /** The label that sits under the big count, or the whole message when nothing was claimed. */
  lead: string;
  line: string;
  /** Only when something was stolen (and so something was claimed). */
  stolen: string | null;
}

/** Claimed and stolen are both the player's TEAM's counts (types.ts), so the copy says so. */
export function midBossCopy(m: MidBoss): MidBossCopy {
  if (m.claimed <= 0) {
    return {
      lead: "No Rejuvenators claimed by your team yet",
      line: "The Mid Boss is still waiting for you. Go say hello, he brings gifts.",
      stolen: null,
    };
  }
  // Stolen is a subset of claimed, so it only ever shows next to a claimed count.
  const stolen =
    m.stolen > 0
      ? `Stolen by your team: ${m.stolen}. The other team killed the boss, your team took the prize.`
      : null;
  return {
    lead:
      m.claimed === 1 ? "Rejuvenator claimed by your team" : "Rejuvenators claimed by your team",
    line: "Your team knows the way to the pit.",
    stolen,
  };
}

// ========================================================= Slides 8-10: roast to MVP

const plural = (n: number, one: string, many: string) => (n === 1 ? one : many);

// ---------------------------------------------------------------- Roast (slide 8)

/** `count` is the hottest cell's count. */
export function hotspotLine(count: number): string {
  return `You died here ${count} ${plural(count, "time", "times")}`;
}

export function noDeathMapLine(deaths: number): string {
  return deaths === 0
    ? "Not a single death on file. Either you are untouchable or the ledger is being polite."
    : "The ledger knows you died, just not where. No death spots came through for these matches.";
}

export function deathsLabel(deaths: number): string {
  return `${plural(deaths, "death", "deaths")} in total`;
}

export function worstMatchLine({ deaths, heroName: hero }: { deaths: number; heroName: string }) {
  return `Worst night: ${deaths} ${plural(deaths, "death", "deaths")} as ${hero}`;
}

// ------------------------------------------------------------ Rank journey (slide 9)

export const RANK_EMPTY_LINE =
  "No ranked history on file yet. Play some ranked matches and your climb will show up here.";

/**
 * One fixed line for any journey (ADR 0053 allows data-driven variants only on the roast and MVP
 * slides). A single badge and no history are the two states that need their own words.
 */
export type RankSummaryKind = "empty" | "single" | "journey";

export function rankSummary(
  journey: readonly JourneyPoint[],
  current: JourneyPoint | null,
): { kind: RankSummaryKind; text: string } {
  if (!current || journey.length === 0) return { kind: "empty", text: RANK_EMPTY_LINE };
  const now = rankLabel(current);
  if (journey.length === 1) {
    return {
      kind: "single",
      text: `You're at ${now} so far. One badge isn't a climb yet, so play on and the line will draw itself.`,
    };
  }
  const peak = journey.reduce((best, p) => (p.badge > best.badge ? p : best), journey[0]);
  const peakNote = peak.badge > current.badge ? ` Your peak was ${rankLabel(peak)}.` : "";
  return {
    kind: "journey",
    text: `You started at ${rankLabel(journey[0])} and now sit at ${now}.${peakNote}`,
  };
}

// ------------------------------------------------------------------- MVP (slide 10)

// The headline is fixed (`headlineFor("mvp")`); the fallback and empty cases speak in the body.
export const MVP_FALLBACK_LEAD = "Your best stat so far";
const MVP_NONE_LINE =
  "Still finding your signature. There isn't enough to crown a stat yet, so play a few more matches and check back.";

export function mvpFlavor(topPercent: number): string {
  if (topPercent <= 1) return "Rare air. Hardly anyone else is up here.";
  if (topPercent <= 10) return "That's elite company.";
  if (topPercent <= NOT_NOTABLE_ABOVE) return "Comfortably ahead of the pack.";
  return "Nothing stands out yet, so this is your closest. Keep playing and it will move.";
}

export type MvpCopy =
  | {
      kind: "hero" | "global" | "fallback";
      /** Set for the fallback only: a line above the stat saying it is the best of a quiet bunch. */
      lead?: string;
      /** The stat, e.g. "Melee kills". */
      label: string;
      /** Already formatted, without the "Top" or the "%". */
      topPercent: string;
      /** "of Infernus players" (hero scope only) or "of all players". */
      scopeLine: string;
      flavor: string;
      /** Set for the hero scope only. */
      heroName?: string;
      heroId?: number;
    }
  | { kind: "none"; line: string };

const NONE: MvpCopy = { kind: "none", line: MVP_NONE_LINE };

/**
 * One template for every case (label, top percent, scope). "Not notable" means the signature
 * stat's top percent is above 50: the slide then shows the best global stat with neutral copy
 * and no same-hero phrasing. A null `mvp` gets its own copy.
 */
export function mvpCopy({ mvp, percentiles }: Pick<StoryData, "mvp" | "percentiles">): MvpCopy {
  if (!mvp) return NONE;
  if (mvp.topPercent <= NOT_NOTABLE_ABOVE) {
    const shared = {
      label: mvp.label,
      topPercent: formatTopPercent(mvp.topPercent),
      flavor: mvpFlavor(mvp.topPercent),
    };
    if (mvp.scope === "hero") {
      const hero = heroName(mvp.heroId);
      return {
        kind: "hero",
        ...shared,
        scopeLine: `of ${hero} players`,
        heroName: hero,
        heroId: mvp.heroId,
      };
    }
    return { kind: "global", ...shared, scopeLine: "of all players" };
  }
  const best = percentiles.reduce<(typeof percentiles)[number] | null>(
    (b, p) => (!b || p.topPercent < b.topPercent ? p : b),
    null,
  );
  if (!best) return NONE;
  return {
    kind: "fallback",
    lead: MVP_FALLBACK_LEAD,
    label: best.label,
    topPercent: formatTopPercent(best.topPercent),
    scopeLine: "of all players",
    // The weighted pick can be above 50 while the best global stat is better than that.
    flavor: mvpFlavor(best.topPercent),
  };
}

export const MENTIONS_HEADING = "Honorable mentions";
/** How many runner-up stats sit under the signature stat. */
export const MAX_MENTIONS = 2;

/** A short hype line for a runner-up stat, by how rare it is (ADR 0007). */
export function mentionLine(topPercent: number): string {
  if (topPercent <= 1) return "Rare air.";
  if (topPercent <= 10) return "Elite company.";
  if (topPercent <= 25) return "Well ahead of the pack.";
  return "Quietly good.";
}

export interface MvpMention {
  label: string;
  topPercent: string;
  note: string;
  line: string;
}

/**
 * Up to two more standout stats for the signature slide: the best global stats other than the one
 * already on show, each in the top 50% (the same "notable" line as the MVP). None when there is no
 * signature stat, since that slide then shows its friendly empty copy.
 */
export function mvpMentions({
  mvp,
  percentiles,
}: Pick<StoryData, "mvp" | "percentiles">): MvpMention[] {
  if (!mvp) return [];
  const best = bestPercentile(percentiles);
  const shown = mvp.topPercent <= NOT_NOTABLE_ABOVE ? mvp.label : best?.label;
  return percentiles
    .filter((p) => p.label !== shown && p.topPercent <= NOT_NOTABLE_ABOVE)
    .sort((a, b) => a.topPercent - b.topPercent)
    .slice(0, MAX_MENTIONS)
    .map((p) => ({
      label: p.label,
      topPercent: formatTopPercent(p.topPercent),
      note: "of all players",
      line: mentionLine(p.topPercent),
    }));
}

// ===================================================================== Slide 11: summary

/** Copy for the summary slide (slide 11). Plain, short, in the ledger's voice (ADR 0053). */
export const SUMMARY_COPY = {
  matches: "Matches",
  hours: "Hours played",
  main: "Main hero",
  rank: "Current rank",
  heroPoolLabel: "Your hero pool",
  /** The stamp's text: decorative, so it is hidden from screen readers (the headline says it). */
  stamp: "Entered into the ledger",
} as const;

const topPercentText = (topPercent: number) => `Top ${formatTopPercent(topPercent)}%`;

export interface TopStat {
  label: string;
  value: string;
  /** Who the percentile is against: "of Infernus players" (same hero) or "of all players". */
  note: string;
}

/**
 * The one stat on the card, following the MVP slide (ADR 0053): the MVP if it is notable (top 50%
 * or better); otherwise the best global percentile with neutral, all-players phrasing, even when
 * it is no boast; nothing only when there are no percentiles at all.
 */
export function topStat(story: StoryData): TopStat | null {
  const { mvp } = story;
  if (mvp && mvp.topPercent <= NOT_NOTABLE_ABOVE) {
    return {
      label: mvp.label,
      value: topPercentText(mvp.topPercent),
      note: mvp.scope === "hero" ? `of ${heroName(mvp.heroId)} players` : "of all players",
    };
  }
  const best = bestPercentile(story.percentiles);
  if (!best) return null;
  return { label: best.label, value: topPercentText(best.topPercent), note: "of all players" };
}

export interface SummaryRow {
  key: "matches" | "hours" | "main" | "topStat" | "rank";
  label: string;
  value: string;
  note?: string;
}

/** The ledger lines of the summary card, in order. Lines without data are left out. */
export function summaryRows(story: StoryData): SummaryRow[] {
  const rows: SummaryRow[] = [
    {
      key: "matches",
      label: SUMMARY_COPY.matches,
      value: story.intro.matches.toLocaleString("en-US"),
    },
    { key: "hours", label: SUMMARY_COPY.hours, value: formatHours(story.intro.hoursPlayed) },
  ];
  if (story.main) {
    rows.push({ key: "main", label: SUMMARY_COPY.main, value: heroName(story.main.heroId) });
  }
  const top = topStat(story);
  if (top) rows.push({ key: "topStat", label: top.label, value: top.value, note: top.note });
  if (story.rank.current) {
    rows.push({ key: "rank", label: SUMMARY_COPY.rank, value: rankLabel(story.rank.current) });
  }
  return rows;
}

export interface SummaryHero {
  heroId: number;
  name: string;
  matches: string;
  winRate: string;
}

export interface SummaryHeroPool {
  caption: string;
  heroes: SummaryHero[];
}

/** The most-played heroes for the share card (compact tiles), or null if there are none. */
export function summaryHeroPool(story: StoryData): SummaryHeroPool | null {
  const { heroesPlayed, topHeroes } = story.roster;
  if (topHeroes.length === 0) return null;
  const count = `${heroesPlayed.toLocaleString("en-US")} ${heroesPlayed === 1 ? "hero" : "heroes"}`;
  return {
    caption: `Hero pool: ${count}`,
    heroes: topHeroes.slice(0, 5).map((h) => ({
      heroId: h.heroId,
      name: heroName(h.heroId),
      matches: `${h.matches.toLocaleString("en-US")} ${matchesUnit(h.matches)}`,
      winRate: `${formatPercent(h.winRate)} wins`,
    })),
  };
}
