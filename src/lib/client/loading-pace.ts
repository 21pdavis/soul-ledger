import type { ClientLookupEvent } from "@/lib/client/lookup-stream";

/**
 * How long the loader shows each thing (ADR 0056). Real events still decide WHAT is shown and in
 * which order; this only decides how long a stage stays on screen before the next one may replace
 * it, so a quick lookup can still be read. All times are in milliseconds.
 */
export interface PaceConfig {
  /** How long a stage (profile, history, details) stays up before the next stage may be shown. */
  stageDwellMs: number;
  /** The least time a tally counter takes to count up to its value, however fast the data came. */
  tallyCountMs: number;
  /** How long the last stage stays up, after its dwell, before the story replaces the loader. */
  finalTailMs: number;
}

/**
 * The real pacing. A fully cached lookup (every event within ~100 ms) takes about 4.2 s: the
 * profile, then 1.6 s later the history and the up-to-date tally, then 1.6 s of reading and a 1 s
 * tail. A lookup whose real events are slower than this adds nothing beyond them.
 */
export const LOADING_PACE: PaceConfig = {
  stageDwellMs: 1600,
  tallyCountMs: 1200,
  finalTailMs: 1000,
};

/** No pacing: every event is shown as it arrives. Used by tests, and by the override below. */
export const NO_PACE: PaceConfig = { stageDwellMs: 0, tallyCountMs: 0, finalTailMs: 0 };

/**
 * `localStorage` key whose value `"off"` switches pacing off (the e2e suites set it). It can only
 * remove delay, never add it or change what is shown, so it is harmless if a player sets it.
 */
export const PACE_OVERRIDE_KEY = "soul-ledger:loading-pace";

/** The pacing to use for a lookup: the real one unless the override says `"off"`. */
export function resolvePace(): PaceConfig {
  try {
    return globalThis.localStorage?.getItem(PACE_OVERRIDE_KEY) === "off" ? NO_PACE : LOADING_PACE;
  } catch {
    return LOADING_PACE; // storage blocked: keep the normal pacing
  }
}

export type FinalEvent = Extract<ClientLookupEvent, { type: "story" | "error" }>;

export interface PacerOutput {
  /**
   * The progress events to show, in order, ready for `loadingStage`. The same array object is
   * returned until something new is shown, so the caller can compare by reference.
   */
  shown: ClientLookupEvent[];
  /** The story or error to move on to, once the loader may be replaced. */
  final: FinalEvent | null;
  /** When to call `advance` next (same clock as `now`), or null when nothing is waiting. */
  wakeAt: number | null;
}

/**
 * A pure state machine over an explicit clock: every call passes the current time in `now`, so it
 * needs no timers and is trivial to test. The caller owns the real timer and calls `advance` at
 * `wakeAt`.
 */
export interface LoadingPacer {
  push(event: ClientLookupEvent, now: number): PacerOutput;
  advance(now: number): PacerOutput;
}

/** Stages in the order the loader fills in. `done` is not a stage: it only ends the last one. */
const DONE = 4;

function stageOf(event: ClientLookupEvent): number | null {
  switch (event.type) {
    case "resolved":
      return 0;
    case "profile":
      return 1;
    case "history":
      return 2;
    case "details":
      return 3;
    case "done":
      return DONE;
    default:
      return null;
  }
}

interface Queued {
  event: ClientLookupEvent;
  stage: number;
}

/**
 * Paces the loader (ADR 0056). A timer NEVER moves the loader to a stage by itself: a stage is only
 * ever shown because its real event arrived (ADR 0014, 0052). Time only holds events back:
 *
 * - A stage that goes up stays at least `stageDwellMs` before the next stage is shown. Events that
 *   arrive sooner wait in a queue, in stage order, one per stage (a newer event for a queued stage
 *   replaces it, and details never go backwards).
 * - Updates to a stage already on screen (more details, a repeated profile) and `waiting` are shown
 *   at once. An error is released at once and drops the queue.
 * - The story is released once the queue is empty and the last stage has had its dwell plus
 *   `finalTailMs`. A slow lookup is already past that, so it adds nothing.
 */
export function createLoadingPacer(config: PaceConfig): LoadingPacer {
  let shown: ClientLookupEvent[] = [];
  let queue: Queued[] = [];
  let shownStage = 0;
  let lastStepAt = -Infinity;
  let pendingStory: FinalEvent | null = null;
  let final: FinalEvent | null = null;

  const show = (event: ClientLookupEvent) => {
    shown = [...shown, event];
  };
  const dwell = () => (shownStage === 0 ? 0 : config.stageDwellMs);
  const nextStepAt = () => lastStepAt + dwell();
  const releaseAt = () => lastStepAt + dwell() + config.finalTailMs;

  const enqueue = (event: ClientLookupEvent, stage: number) => {
    const at = queue.findIndex((q) => q.stage >= stage);
    const same = at >= 0 && queue[at].stage === stage ? queue[at] : null;
    if (!same) {
      queue = [
        ...queue.slice(0, at < 0 ? queue.length : at),
        { event, stage },
        ...queue.slice(at < 0 ? queue.length : at),
      ];
      return;
    }
    // A newer event replaces the queued one, but the counters never go backwards.
    const keep =
      event.type === "details" &&
      same.event.type === "details" &&
      event.fetched < same.event.fetched;
    if (!keep) same.event = event;
  };

  const settle = (now: number): PacerOutput => {
    if (!final) {
      while (queue.length > 0) {
        const [front] = queue;
        if (front.stage !== DONE) {
          if (now < nextStepAt()) break;
          shownStage = front.stage;
          lastStepAt = now;
        }
        show(front.event);
        queue = queue.slice(1);
      }
      if (pendingStory && queue.length === 0 && now >= releaseAt()) final = pendingStory;
    }

    let wakeAt: number | null = null;
    if (!final) {
      if (queue.length > 0) wakeAt = nextStepAt();
      else if (pendingStory) wakeAt = releaseAt();
    }
    return { shown, final, wakeAt };
  };

  return {
    push(event, now) {
      if (final) return settle(now);
      if (event.type === "error") {
        queue = [];
        pendingStory = null;
        final = event;
      } else if (event.type === "story") {
        pendingStory = event;
      } else if (event.type === "waiting") {
        show(event);
      } else {
        const stage = stageOf(event);
        if (stage === null) return settle(now); // an event type this client does not know
        if (stage === DONE) {
          if (queue.length === 0) show(event);
          else enqueue(event, stage);
        } else if (stage <= shownStage) {
          show(event); // an update to a stage already on screen: no dwell needed
        } else {
          enqueue(event, stage);
        }
      }
      return settle(now);
    },
    advance: settle,
  };
}
