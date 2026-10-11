import type { ClientLookupEvent } from "@/lib/client/lookup-stream";
import { LOADING_COPY } from "@/story/copy";
import { heroMonogram, heroName } from "@/story/heroes";

/** The three stages of ADR 0014. Stage 0 is the moment before the profile arrives. */
export type LoadingStageNumber = 0 | 1 | 2 | 3;

export interface HeroTile {
  id: number;
  name: string;
  monogram: string;
}

export interface LoadingView {
  /** The furthest stage any event has reached. It never goes back. */
  stage: LoadingStageNumber;
  /** True while the latest event is `waiting` (another lookup holds the fetch). */
  waiting: boolean;
  /** The sync finished; the story is about to arrive. */
  done: boolean;
  profile: { name: string | null; avatarUrl: string | null } | null;
  history: { totalMatches: number; newMatches: number; summary: string; heroes: HeroTile[] } | null;
  details: {
    fetched: number;
    total: number;
    /** 0 to 1. A total of 0 means there is nothing to fetch, so it counts as complete. */
    fraction: number;
    complete: boolean;
    kills: number;
    breakables: number;
    sinnerJackpots: number;
  } | null;
  /** A line saying what is happening right now. Never empty, so the page is never blank. */
  note: string;
  /** What a screen reader hears. It changes on stage changes only, never on counter ticks. */
  announcement: string;
}

/**
 * Steam avatars come from Steam's CDN over https. Anything else (another host, http, a data: or
 * javascript: URL) is dropped so the page never makes a request the player did not expect.
 */
export function safeAvatarUrl(url: string | null): string | null {
  if (!url) return null;
  try {
    const { protocol, hostname } = new URL(url);
    const steamCdn = hostname === "steamstatic.com" || hostname.endsWith(".steamstatic.com");
    return protocol === "https:" && steamCdn ? url : null;
  } catch {
    return null;
  }
}

type Of<T extends ClientLookupEvent["type"]> = Extract<ClientLookupEvent, { type: T }>;

/**
 * Turns the NDJSON progress events received so far into what the loader shows (ADR 0014, 0052).
 * Driven only by events, never by time. Events may repeat or arrive out of order: the stage only
 * moves forward, each stage shows its latest data, and the counters never tick backwards.
 */
export function loadingStage(progress: readonly ClientLookupEvent[]): LoadingView {
  let profile: Of<"profile"> | null = null;
  let history: Of<"history"> | null = null;
  let details: Of<"details"> | null = null;
  let waiting = false;
  let done = false;
  let status: Of<"status"> | null = null;

  for (const event of progress) {
    if (event.type === "waiting") {
      waiting = true;
      continue;
    }
    if (event.type === "status") {
      status = event;
      waiting = false;
      continue;
    }
    status = null; // any real progress replaces the last status
    if (event.type === "profile") profile = event;
    else if (event.type === "history") history = event;
    else if (event.type === "details") {
      if (!details || event.fetched >= details.fetched) details = event;
    } else if (event.type === "done") done = true;
    else if (event.type !== "resolved") continue; // final events do not belong here
    waiting = false;
  }

  // When every match is already stored the server sends no details events at all (resolved,
  // profile, history with newMatches 0, done), so there is nothing to read: a finished, empty tally.
  if (!details && history && history.newMatches === 0) {
    details = { type: "details", fetched: 0, total: 0, kills: 0, breakables: 0, sinnerJackpots: 0 };
  }

  const stage: LoadingStageNumber = details ? 3 : history ? 2 : profile ? 1 : 0;

  const view: Omit<LoadingView, "announcement" | "note"> = {
    stage,
    waiting,
    done,
    profile: profile
      ? { name: profile.personaName, avatarUrl: safeAvatarUrl(profile.avatarUrl) }
      : null,
    history: history
      ? {
          totalMatches: history.totalMatches,
          newMatches: history.newMatches,
          summary: LOADING_COPY.matchesSummary(history.totalMatches, history.newMatches),
          heroes: [...new Set(history.heroIds)].map((id) => ({
            id,
            name: heroName(id),
            monogram: heroMonogram(id),
          })),
        }
      : null,
    details: details
      ? {
          fetched: details.fetched,
          total: details.total,
          fraction: details.total > 0 ? Math.min(1, details.fetched / details.total) : 1,
          complete: details.fetched >= details.total,
          kills: details.kills,
          breakables: details.breakables,
          sinnerJackpots: details.sinnerJackpots,
        }
      : null,
  };

  return { ...view, note: noteFor(view, status), announcement: announce(view) };
}

type BaseView = Omit<LoadingView, "announcement" | "note">;

function noteFor(view: BaseView, status: Of<"status"> | null): string {
  const copy = LOADING_COPY.status;
  if (view.done) return LOADING_COPY.sealing;
  if (view.waiting) return LOADING_COPY.waiting;
  if (status?.step === "rate_limited") {
    return copy.rateLimited(Math.max(1, Math.ceil((status.waitMs ?? 0) / 1000)));
  }
  if (status?.step === "batch") {
    return copy.batch(Math.max(0, (status.total ?? 0) - (status.fetched ?? 0)));
  }
  if (status?.step === "finishing") return copy.finishing;
  if (status?.step === "contacting") return copy.contacting;
  if (view.stage === 0) return LOADING_COPY.title;
  return view.stage === 1 ? copy.reading : copy.fetching;
}

function announce(view: BaseView): string {
  if (view.done) return LOADING_COPY.sealing;
  if (view.waiting) return LOADING_COPY.waiting;
  if (view.stage === 3) return LOADING_COPY.announceDetails;
  if (view.stage === 2 && view.history) return `${view.history.summary}.`;
  if (view.stage === 1 && view.profile) return LOADING_COPY.announceProfile(view.profile.name);
  return LOADING_COPY.title;
}
