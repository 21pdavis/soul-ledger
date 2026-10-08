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
  disclaimer: "Non-commercial fan project. Not affiliated with or endorsed by Valve.",
} as const;

export const LOADING_COPY = {
  title: "Looking up your ledger...",
} as const;

export const STALE_NOTE = "Showing cached matches. We couldn't reach the latest ones just now.";

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
