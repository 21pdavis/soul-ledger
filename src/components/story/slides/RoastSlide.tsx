import {
  avgMatchMinutes,
  deathsLabel,
  hotspotLine,
  noDeathMapLine,
  unspentSoulsLine,
  worstMatchLine,
} from "@/story/copy-slides-8-10";
import { headlineFor } from "@/story/copy";
import { binDeaths, hottestCell } from "@/story/death-bins";
import { heroName } from "@/story/heroes";
import { SlideFrame } from "../SlideFrame";
import type { SlideComponent } from "./contract";
import { DeathHeatmap } from "./DeathHeatmap";
import styles from "./RoastSlide.module.css";
import { StaggerIn } from "./StaggerIn";
import { TallyNumber } from "./TallyNumber";

export const RoastSlide: SlideComponent = ({ story, skipAnimation, reducedMotion, paused }) => {
  const { roast, intro, matchCount } = story;
  const motion = { skipAnimation, reducedMotion, paused };
  const bins = binDeaths(roast.deathPositions);
  const hot = hottestCell(bins);
  const stash = unspentSoulsLine(
    roast.avgUnspentGoldMinutes,
    avgMatchMinutes(intro.hoursPlayed, matchCount),
  );

  return (
    <SlideFrame headline={headlineFor("roast")}>
      <div className={styles.content}>
        <StaggerIn index={0} {...motion} className={styles.plotBlock}>
          {hot ? (
            <>
              <DeathHeatmap bins={bins} hot={hot} still={reducedMotion || skipAnimation} />
              <p className={styles.hotspot}>{hotspotLine(hot.count)}</p>
            </>
          ) : (
            <p className={styles.friendly}>{noDeathMapLine(roast.deaths)}</p>
          )}
        </StaggerIn>

        <StaggerIn index={1} {...motion}>
          <div className={styles.totals}>
            <span className={styles.bigNumber}>
              <TallyNumber value={roast.deaths} {...motion} />
            </span>
            <p className={styles.bigLabel}>{deathsLabel(roast.deaths)}</p>
          </div>
        </StaggerIn>

        {roast.worstMatch && roast.worstMatch.deaths > 0 && (
          <StaggerIn index={2} {...motion}>
            <p className={styles.worst}>
              {worstMatchLine({
                deaths: roast.worstMatch.deaths,
                heroName: heroName(roast.worstMatch.heroId),
              })}
            </p>
          </StaggerIn>
        )}

        <StaggerIn index={3} {...motion}>
          <p className={styles.unspent} data-testid="unspent-souls">
            {stash}
          </p>
        </StaggerIn>
      </div>
    </SlideFrame>
  );
};
