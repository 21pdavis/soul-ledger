import type { SlideProps } from "@/story/types";
import { windowLabel } from "@/story/window-label";

/** Which window the story covers ("All time" or "Since patch <date>"); slides drop this in. */
export function WindowLabel({ meta, className }: { meta: SlideProps["meta"]; className?: string }) {
  return <p className={className}>{windowLabel(meta)}</p>;
}
