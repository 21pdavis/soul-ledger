import { useEffect, useRef } from "react";
import type { StoryWindow } from "@/lib/lookup";
import {
  ERROR_COPY,
  noMatchesDetails,
  rateLimitedBody,
  STORY_ACTIONS_COPY,
  type ErrorKind,
} from "@/story/copy";
import styles from "./ErrorScreen.module.css";

export type { ErrorKind };

interface Props {
  kind: ErrorKind;
  /** The window the lookup used: the zero-matches screen mentions the patch for "patch". */
  window: StoryWindow;
  /** Games the story skipped (Street Brawl and the like); only used by the zero-matches screen. */
  excludedMatches?: number;
  /** Seconds the server asked us to wait; only used by the rate-limit screen. */
  retryAfter?: number;
  /** Runs the same lookup again. */
  onRetry: () => void;
  /** Goes back to the entry screen. */
  onNewLookup: () => void;
}

/** Full-screen, in-voice screen for a lookup that did not produce a story (ADR 0052). */
export function ErrorScreen({
  kind,
  window,
  excludedMatches = 0,
  retryAfter = 60,
  onRetry,
  onNewLookup,
}: Props) {
  const copy = ERROR_COPY[kind];
  // The loader that had focus is gone, so move focus to the title: screen readers read it out.
  const title = useRef<HTMLHeadingElement>(null);
  useEffect(() => title.current?.focus(), []);
  const details = kind === "no_matches" ? noMatchesDetails(window, excludedMatches) : [];
  const retries = copy.action.does === "retry";
  return (
    <div className={styles.screen}>
      <svg className={styles.seal} viewBox="0 0 100 100" aria-hidden="true">
        <circle cx="50" cy="50" r="46" />
        <circle cx="50" cy="50" r="38" className={styles.inner} />
        <path d="M50 4 V12 M50 88 V96 M4 50 H12 M88 50 H96 M17 17 L23 23 M77 77 L83 83 M83 17 L77 23 M23 77 L17 83" />
        <text x="50" y="50" textAnchor="middle" dominantBaseline="central">
          {copy.seal}
        </text>
      </svg>
      <h1 ref={title} tabIndex={-1} className={styles.title}>
        {copy.title}
      </h1>
      <p className={styles.body}>
        {kind === "rate_limited" ? rateLimitedBody(retryAfter) : copy.body}
      </p>
      {details.map((d) => (
        <p key={d} className={styles.detail}>
          {d}
        </p>
      ))}
      <div className={styles.actions}>
        <button type="button" className={styles.primary} onClick={retries ? onRetry : onNewLookup}>
          {copy.action.label}
        </button>
        {retries && (
          <button type="button" className={styles.secondary} onClick={onNewLookup}>
            {STORY_ACTIONS_COPY.newLookup}
          </button>
        )}
      </div>
    </div>
  );
}
