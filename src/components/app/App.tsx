"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import {
  streamLookup,
  type ClientLookupEvent,
  type ClientLookupRequest,
} from "@/lib/client/lookup-stream";
import {
  createLoadingPacer,
  resolvePace,
  type FinalEvent,
  type PaceConfig,
} from "@/lib/client/loading-pace";
import { defaultPrefs, readPrefsSnapshot, savePrefs, type Prefs } from "@/lib/client/prefs";
import type { StoryWindow } from "@/lib/lookup";
import type { ErrorKind } from "@/story/copy";
import type { LookupFilters } from "@/story/filters";
import type { SlideProps, StoryActions, StoryData, StoryMeta } from "@/story/types";
import { usePrefersReducedMotion } from "@/components/story/useMediaQuery";
import { WorldLayer } from "@/components/world/WorldLayer";
import { EntryScreen } from "./EntryScreen";
import { Disclaimer } from "./Disclaimer";
import { ErrorScreen } from "./ErrorScreen";
import { LoadingScreen } from "./LoadingScreen";
import { ScreenShell } from "./ScreenShell";
import { StoryStage } from "./StoryStage";
import styles from "./App.module.css";

/**
 * Where the app is (ADR 0052). The flow: entry -> loading -> story | error.
 *
 * - `loading.progress` is the non-final events the loader has been allowed to show so far: the
 *   pacer releases them one stage at a time so each can be read (ADR 0056).
 * - `story` is only ever entered with `story.matchCount > 0`; zero matches is an error screen.
 */
export type Phase =
  | { name: "entry" }
  | { name: "loading"; progress: ClientLookupEvent[]; countMs: number }
  | { name: "story"; story: StoryData; meta: StoryMeta }
  | { name: "error"; kind: ErrorKind; window: StoryWindow; excludedMatches: number };

interface Props {
  /** For tests: replaces the global `fetch` used for the lookup. */
  fetchImpl?: typeof fetch;
  /** For tests: replaces the loader pacing (`NO_PACE` skips every wait). Default: `resolvePace()`. */
  pace?: PaceConfig;
  /** Silence from the server for this long (ms) shows the "taking longer" message. */
  stallMs?: number;
}

/** How long a lookup may go without any news before we say it is slow and offer a retry. */
export const STALL_MS = 20_000;

const subscribeNothing = () => () => {};

export function App({ fetchImpl, pace, stallMs = STALL_MS }: Props) {
  const [phase, setPhase] = useState<Phase>({ name: "entry" });
  const [request, setRequest] = useState<ClientLookupRequest | null>(null);
  // Bumped by Replay: remounting the story starts it again at slide 1.
  const [replayCount, setReplayCount] = useState(0);
  const [lastEntry, setLastEntry] = useState<Prefs | null>(null);
  const [stalled, setStalled] = useState(false);
  const running = useRef<AbortController | null>(null);
  const reducedMotion = usePrefersReducedMotion();

  // Remembered URL and filters. `null` while server rendering, so hydration matches.
  const stored = useSyncExternalStore(subscribeNothing, readPrefsSnapshot, () => null);

  useEffect(() => () => running.current?.abort(), []);

  const run = useCallback(
    async (next: ClientLookupRequest) => {
      running.current?.abort();
      const controller = new AbortController();
      running.current = controller;
      setRequest(next);
      // The pacer holds real events back so each stage can be read (ADR 0056). It never invents
      // one: the loader only shows what arrived, and the story or error is released through it.
      const config = pace ?? resolvePace();
      const pacer = createLoadingPacer(config);
      setPhase({ name: "loading", progress: [], countMs: config.tallyCountMs });
      let timer: ReturnType<typeof setTimeout> | undefined;
      // The server sends a status before every step, so long silence means something is stuck.
      let stallTimer: ReturnType<typeof setTimeout> | undefined;
      const watchStall = () => {
        clearTimeout(stallTimer);
        setStalled(false);
        stallTimer = setTimeout(() => setStalled(true), stallMs);
      };
      controller.signal.addEventListener("abort", () => {
        clearTimeout(timer);
        clearTimeout(stallTimer);
      });
      watchStall();

      const finish = (event: FinalEvent) => {
        clearTimeout(stallTimer);
        setStalled(false);
        if (event.type === "error") {
          setPhase({
            name: "error",
            kind: event.reason,
            window: next.window,
            excludedMatches: 0,
          });
        } else if (event.story.matchCount === 0) {
          // Nothing to tell: the story never mounts without matches (ADR 0052).
          setPhase({
            name: "error",
            kind: "no_matches",
            // The window the server really used: a patch request without a patch date was
            // served all-time data (#25), so it must not blame the patch.
            window: event.window === "patch" && event.patchStart ? "patch" : "all",
            excludedMatches: event.story.excludedMatches,
          });
        } else {
          setPhase({
            name: "story",
            story: event.story,
            meta: {
              window: event.window,
              patchStart: event.patchStart,
              patchUnavailable: event.patchUnavailable,
              stale: event.stale,
            },
          });
        }
      };

      const apply = (out: ReturnType<typeof pacer.advance>) => {
        if (controller.signal.aborted) return;
        clearTimeout(timer);
        if (out.final) return finish(out.final);
        setPhase((p) =>
          p.name === "loading" && p.progress !== out.shown ? { ...p, progress: out.shown } : p,
        );
        if (out.wakeAt !== null) {
          timer = setTimeout(
            () => apply(pacer.advance(performance.now())),
            Math.max(0, out.wakeAt - performance.now()),
          );
        }
      };

      for await (const event of streamLookup(next, {
        fetch: fetchImpl,
        signal: controller.signal,
      })) {
        if (controller.signal.aborted) return;
        watchStall();
        apply(pacer.push(event, performance.now()));
      }
    },
    [fetchImpl, pace, stallMs],
  );

  const submit = useCallback(
    (input: string, filters: LookupFilters) => {
      const prefs = { url: input, filters };
      savePrefs(prefs);
      setLastEntry(prefs);
      void run({ input, ...filters, refresh: false });
    },
    [run],
  );

  const actions = useMemo<StoryActions>(
    () => ({
      // Same URL, same window; only the refresh flag changes.
      onRefresh: () => request && void run({ ...request, refresh: true }),
      onReplay: () => setReplayCount((n) => n + 1),
      onNewLookup: () => {
        running.current?.abort();
        setPhase({ name: "entry" });
      },
    }),
    [request, run],
  );

  if (phase.name === "story") {
    const props: SlideProps = { story: phase.story, meta: phase.meta, actions };
    return (
      <div className={styles.storyPage}>
        <StoryStage key={replayCount} {...props} />
        <div className={styles.notices}>
          <Disclaimer />
        </div>
      </div>
    );
  }

  // The city sits behind the entry, loading and error screens as scenery (no story to follow
  // yet). It stays mounted across them; the story mounts its own, which follows the slides.
  return (
    <>
      <WorldLayer started reducedMotion={reducedMotion} />
      <ScreenShell>
        {phase.name === "entry" && (
          <EntryScreen
            // Remount when the remembered values arrive (after hydration) or change.
            key={lastEntry ? "typed" : stored ? "restored" : "initial"}
            initial={lastEntry ?? stored ?? defaultPrefs()}
            onSubmit={submit}
            focusTitle={request !== null}
          />
        )}
        {phase.name === "loading" && (
          <LoadingScreen
            progress={phase.progress}
            countMs={phase.countMs}
            stalled={stalled}
            onRetry={() => request && void run(request)}
          />
        )}
        {phase.name === "error" && (
          <ErrorScreen
            kind={phase.kind}
            window={phase.window}
            excludedMatches={phase.excludedMatches}
            onRetry={() => request && void run(request)}
            onNewLookup={actions.onNewLookup}
          />
        )}
      </ScreenShell>
    </>
  );
}
