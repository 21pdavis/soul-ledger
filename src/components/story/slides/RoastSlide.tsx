import {
  avgMatchMinutes,
  deathsLabel,
  headlineFor,
  hotspotLine,
  noDeathMapLine,
  unspentSoulsLine,
  worstMatchLine,
} from "@/story/copy";
import { binDeaths, hottestCell } from "@/story/death-bins";
import { heroName } from "@/story/heroes";
import { SlideFrame } from "../SlideFrame";
import { SlideReveal } from "../SlideReveal";
import { StoryCountUp } from "../StoryCountUp";
import type { SlideComponent } from "./contract";
import { DeathHeatmap } from "./DeathHeatmap";
import styles from "./RoastSlide.module.css";

export const RoastSlide: SlideComponent = ({ story, skipAnimation, reducedMotion, paused }) => {
  const { roast, intro, matchCount } = story;
  const animate = !(reducedMotion || skipAnimation);
  const count = { reducedMotion, skipAnimation, paused };
  const bins = binDeaths(roast.deathPositions);
  const hot = hottestCell(bins);
  const stash = unspentSoulsLine(
    roast.avgUnspentGoldMinutes,
    avgMatchMinutes(intro.hoursPlayed, matchCount),
  );

  return (
    <SlideFrame headline={headlineFor("roast")}>
      <div className={styles.content}>
        <SlideReveal index={0} animate={animate} className={styles.plotBlock}>
          {hot ? (
            <>
              <DeathHeatmap bins={bins} hot={hot} still={reducedMotion || skipAnimation} />
              <p className={styles.hotspot}>{hotspotLine(hot.count)}</p>
            </>
          ) : (
            <p className={styles.friendly}>{noDeathMapLine(roast.deaths)}</p>
          )}
        </SlideReveal>

        <SlideReveal index={1} animate={animate}>
          <div className={styles.totals}>
            <span className={styles.bigNumber}>
              <StoryCountUp value={roast.deaths} {...count} />
            </span>
            <p className={styles.bigLabel}>{deathsLabel(roast.deaths)}</p>
          </div>
        </SlideReveal>

        {roast.worstMatch && roast.worstMatch.deaths > 0 && (
          <SlideReveal index={2} animate={animate}>
            <p className={styles.worst}>
              {worstMatchLine({
                deaths: roast.worstMatch.deaths,
                heroName: heroName(roast.worstMatch.heroId),
              })}
            </p>
          </SlideReveal>
        )}

        <SlideReveal index={3} animate={animate}>
          <p className={styles.unspent} data-testid="unspent-souls">
            {stash}
          </p>
        </SlideReveal>
      </div>
    </SlideFrame>
  );
};
