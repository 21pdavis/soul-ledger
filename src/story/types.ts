import type { Story } from "@/lib/stats/story";

/** What a stat type looks like after crossing the wire as JSON: Dates become ISO strings. */
export type Jsonify<T> = T extends Date
  ? string
  : T extends (infer U)[]
    ? Jsonify<U>[]
    : T extends object
      ? { [K in keyof T]: Jsonify<T[K]> }
      : T;

/** The `story` the browser receives from `/api/lookup`. */
export type StoryData = Jsonify<Story>;

/** Every slide component takes exactly this. */
export interface SlideProps {
  story: StoryData;
}
