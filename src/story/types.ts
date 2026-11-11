import type { StoryWindow } from "@/lib/lookup";
import type { Story } from "@/lib/stats/story";

/** What a stat type looks like after crossing the wire as JSON: Dates become ISO strings. */
export type Jsonify<T> = T extends Date
  ? string
  : T extends object
    ? { [K in keyof T]: Jsonify<T[K]> }
    : T;

/** The `story` the browser receives from `/api/lookup`. */
export type StoryData = Jsonify<Story>;

/** What the `story` event carries besides the story itself. */
export interface StoryMeta {
  window: StoryWindow;
  /** ISO start of the current patch (UTC midnight), or null: see #25. */
  patchStart: string | null;
  /** True when "This patch" was asked for but the server had no patch date and sent all-time data. */
  patchUnavailable?: boolean;
  /** True when a refresh failed and the story comes from older cached matches. */
  stale: boolean;
  /** Set when the story is a frozen share link (ADR 0079): ISO time the link was made. */
  shared?: {
    at: string;
    /** Who shared it; null or blank when unknown. */ playerName?: string | null;
  };
}

/** What slides can ask the app to do. */
export interface StoryActions {
  onRefresh: () => void;
  onReplay: () => void;
  onNewLookup: () => void;
  /** Shared mode only: run a normal live lookup for the shared player. */
  onSeeLatest?: () => void;
}

/** Every slide component takes exactly this. */
export interface SlideProps {
  story: StoryData;
  meta: StoryMeta;
  actions: StoryActions;
}
