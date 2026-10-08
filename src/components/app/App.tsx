"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import {
  streamLookup,
  type ClientLookupEvent,
  type ClientLookupRequest,
} from "@/lib/client/lookup-stream";
import { defaultPrefs, readPrefsSnapshot, savePrefs, type Prefs } from "@/lib/client/prefs";
import type { StoryWindow } from "@/lib/lookup";
import type { ErrorKind } from "@/story/copy-entry";
import type { LookupFilters } from "@/story/filters";
import type { SlideProps, StoryActions, StoryData, StoryMeta } from "@/story/types";
import { EntryScreen } from "./EntryScreen";
import { ErrorScreen } from "./ErrorScreen";
import { LoadingScreen } from "./LoadingScreen";
import { ScreenShell } from "./ScreenShell";
import { StaleNote } from "./StaleNote";
import { StoryStage } from "./StoryStage";

/**
 * Where the app is (ADR 0052). The flow: entry -> loading -> story | error.
 *
 * - `loading.progress` collects every non-final event, for the staged loader (PR 3).
 * - `story` is only ever entered with `story.matchCount > 0`; zero matches is an error screen.
 */
export type Phase =
  | { name: "entry" }
  | { name: "loading"; progress: ClientLookupEvent[] }
  | { name: "story"; story: StoryData; meta: StoryMeta }
  | { name: "error"; kind: ErrorKind; window: StoryWindow; excludedMatches: number };

interface Props {
  /** For tests: replaces the global `fetch` used for the lookup. */
  fetchImpl?: typeof fetch;
}

const subscribeNothing = () => () => {};

export function App({ fetchImpl }: Props) {
  const [phase, setPhase] = useState<Phase>({ name: "entry" });
  const [request, setRequest] = useState<ClientLookupRequest | null>(null);
  // Bumped by Replay: remounting the story starts it again at slide 1.
  const [replayCount, setReplayCount] = useState(0);
  const [lastEntry, setLastEntry] = useState<Prefs | null>(null);
  const running = useRef<AbortController | null>(null);

  // Remembered URL and filters. `null` while server rendering, so hydration matches.
  const stored = useSyncExternalStore(subscribeNothing, readPrefsSnapshot, () => null);

  useEffect(() => () => running.current?.abort(), []);

  const run = useCallback(
    async (next: ClientLookupRequest) => {
      running.current?.abort();
      const controller = new AbortController();
      running.current = controller;
      setRequest(next);
      setPhase({ name: "loading", progress: [] });

      for await (const event of streamLookup(next, {
        fetch: fetchImpl,
        signal: controller.signal,
      })) {
        if (controller.signal.aborted) return;
        if (event.type === "error") {
          setPhase({
            name: "error",
            kind: event.reason,
            window: next.window,
            excludedMatches: 0,
          });
        } else if (event.type === "story") {
          if (event.story.matchCount === 0) {
            // Nothing to tell: the story never mounts without matches (ADR 0052).
            setPhase({
              name: "error",
              kind: "no_matches",
              window: next.window,
              excludedMatches: event.story.excludedMatches,
            });
          } else {
            setPhase({
              name: "story",
              story: event.story,
              meta: { window: event.window, patchStart: event.patchStart, stale: event.stale },
            });
          }
        } else {
          setPhase((p) => (p.name === "loading" ? { ...p, progress: [...p.progress, event] } : p));
        }
      }
    },
    [fetchImpl],
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
      <>
        {phase.meta.stale && <StaleNote />}
        <StoryStage key={replayCount} {...props} />
      </>
    );
  }

  return (
    <ScreenShell>
      {phase.name === "entry" && (
        <EntryScreen
          // Remount when the remembered values arrive (after hydration) or change.
          key={lastEntry ? "typed" : stored ? "restored" : "initial"}
          initial={lastEntry ?? stored ?? defaultPrefs()}
          onSubmit={submit}
        />
      )}
      {phase.name === "loading" && <LoadingScreen progress={phase.progress} />}
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
  );
}
