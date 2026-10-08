import type { SlideId } from "@/story/copy";
import type { SlideComponent } from "./contract";
import { IntroSlide } from "./IntroSlide";
import { KillsSlide } from "./KillsSlide";
import { MainSlide } from "./MainSlide";
import { MidBossSlide } from "./MidBossSlide";
import { MvpSlide } from "./MvpSlide";
import { PrecisionSlide } from "./PrecisionSlide";
import { RankSlide } from "./RankSlide";
import { RoastSlide } from "./RoastSlide";
import { RosterSlide } from "./RosterSlide";
import { ScavengerSlide } from "./ScavengerSlide";
import { SummarySlide } from "./SummarySlide";

export type { SlideComponent, SlideComponentProps } from "./contract";

/**
 * Slide id -> component. This is only a lookup: slide logic lives in each slide's own file, and
 * each slide PR replaces just its own file. Never add logic here.
 */
export const SLIDE_COMPONENTS: Record<SlideId, SlideComponent> = {
  intro: IntroSlide,
  main: MainSlide,
  roster: RosterSlide,
  scavenger: ScavengerSlide,
  kills: KillsSlide,
  precision: PrecisionSlide,
  midBoss: MidBossSlide,
  roast: RoastSlide,
  rank: RankSlide,
  mvp: MvpSlide,
  summary: SummarySlide,
};
