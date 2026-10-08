import { headlineFor } from "@/story/copy";
import { SCAVENGER_COPY } from "@/story/copy-slides-1-4";
import { SlideFrame } from "../SlideFrame";
import { SlideReveal } from "../SlideReveal";
import { StoryCountUp } from "../StoryCountUp";
import type { SlideComponent } from "./contract";
import styles from "./ScavengerSlide.module.css";

/**
 * Slide 4: one card, three stats (ADR 0015): Crate Goblin top-left, Gambler middle-right, Urn Mule
 * bottom-left. A zero still renders as 0.
 */
export const ScavengerSlide: SlideComponent = ({ story, skipAnimation, reducedMotion, paused }) => {
  const { scavenger } = story;
  const playing = !reducedMotion && !skipAnimation;
  const count = { reducedMotion, skipAnimation, paused };

  const stats = [
    {
      id: "crate-goblin",
      place: "top-left",
      copy: SCAVENGER_COPY.crateGoblin,
      value: scavenger.breakables,
    },
    {
      id: "gambler",
      place: "middle-right",
      copy: SCAVENGER_COPY.gambler,
      value: scavenger.sinnerJackpots,
    },
    {
      id: "urn-mule",
      place: "bottom-left",
      copy: SCAVENGER_COPY.urnMule,
      value: scavenger.idolsReturned,
    },
  ] as const;

  return (
    <SlideFrame headline={headlineFor("scavenger")}>
      <div className={styles.card} data-testid="scavenger-card">
        {stats.map((s, i) => (
          <SlideReveal
            key={s.id}
            index={i}
            animate={playing}
            kind="stamp"
            className={styles.stat}
            data-testid={`scavenger-${s.id}`}
            data-place={s.place}
          >
            <span className={styles.title}>{s.copy.title}</span>{" "}
            <StoryCountUp value={s.value} className={styles.number} {...count} />{" "}
            <span className={styles.detail}>{s.copy.detail}</span>
          </SlideReveal>
        ))}
      </div>
    </SlideFrame>
  );
};
