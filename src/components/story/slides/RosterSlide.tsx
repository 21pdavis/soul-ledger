import { headlineFor } from "@/story/copy";
import { SlideFrame } from "../SlideFrame";
import type { SlideComponent } from "./contract";

/** Placeholder: replaced by the real slide in its own PR. */
export const RosterSlide: SlideComponent = () => (
  <SlideFrame headline={headlineFor("roster")}>placeholder</SlideFrame>
);
