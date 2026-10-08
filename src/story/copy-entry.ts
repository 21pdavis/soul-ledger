import type { StoryWindow } from "@/lib/lookup";

/**
 * Copy for everything around the story: entry, loading and the error screens (ADR 0052, 0053).
 * Errors say what happened and what to do next, in the ledger's voice. Playful, PG-13.
 */
export const ENTRY_COPY = {
  title: "Soul Ledger",
  tagline: "Your Deadlock year, wrapped.",
  inputLabel: "Paste your Steam profile URL",
  inputPlaceholder: "steamcommunity.com/id/yourname",
  noLogin: "No login needed. We only read the match history your profile already makes public.",
  submit: "Open the ledger",
  invalidInput: "That doesn't look like a Steam profile URL.",
  disclaimer:
    "Non-commercial fan project. Not affiliated with or endorsed by Valve. Deadlock is a trademark of Valve Corporation.",
} as const;

const count = (n: number) => n.toLocaleString("en-US");

/**
 * The staged loader (ADR 0014, 0052). Teasers are shown as each real stage arrives; the
 * `announce*` strings are what screen readers hear, one per stage change.
 */
export const LOADING_COPY = {
  title: "Looking up your ledger...",
  waiting: "Another lookup of this ledger is already running. Waiting our turn.",
  sealing: "Almost ready. Sealing the ledger.",
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

export const STALE_NOTE = "Showing cached matches. We couldn't reach the latest ones just now.";
export const DISMISS = "Dismiss";

export const STORY_ACTIONS_COPY = {
  refresh: "Refresh",
  replay: "Replay",
  newLookup: "Look up another player",
} as const;

export type ErrorKind = "invalid" | "not_found" | "unavailable" | "fetch_failed" | "no_matches";

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
