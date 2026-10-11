import { MENTIONS_HEADING, headlineFor, mvpCopy, mvpMentions } from "@/story/copy";
import { HeroArt } from "../HeroTile";
import { SlideFrame } from "../SlideFrame";
import { SlideReveal } from "../SlideReveal";
import type { SlideComponent } from "./contract";
import styles from "./MvpSlide.module.css";

export const MvpSlide: SlideComponent = ({ story, skipAnimation, reducedMotion }) => {
  const copy = mvpCopy(story);
  const mentions = mvpMentions(story);
  const animate = !(reducedMotion || skipAnimation);

  if (copy.kind === "none") {
    return (
      <SlideFrame headline={headlineFor("mvp")}>
        <SlideReveal index={0} animate={animate}>
          <p className={styles.friendly}>{copy.line}</p>
        </SlideReveal>
      </SlideFrame>
    );
  }

  return (
    <SlideFrame headline={headlineFor("mvp")}>
      <div className={`${styles.card} ${mentions.length > 0 ? styles.compact : ""}`}>
        {copy.lead && (
          <SlideReveal index={0} animate={animate}>
            <p className={styles.lead}>{copy.lead}</p>
          </SlideReveal>
        )}
        <SlideReveal index={0} animate={animate}>
          <p className={styles.label}>{copy.label}</p>
        </SlideReveal>
        <SlideReveal index={1} animate={animate}>
          <p className={styles.big}>Top {copy.topPercent}%</p>
        </SlideReveal>
        <SlideReveal index={2} animate={animate}>
          <div className={styles.scope}>
            {copy.heroName && copy.heroId !== undefined && (
              <span className={styles.monogram} aria-hidden="true">
                <HeroArt
                  heroId={copy.heroId}
                  className={styles.art}
                  fallback={copy.heroName.charAt(0)}
                />
              </span>
            )}
            <p className={styles.scopeLine}>{copy.scopeLine}</p>
          </div>
        </SlideReveal>
        <SlideReveal index={3} animate={animate}>
          <p className={styles.flavor}>{copy.flavor}</p>
        </SlideReveal>
      </div>
      {mentions.length > 0 && (
        <SlideReveal index={4} animate={animate}>
          <section className={styles.mentions}>
            <h3 className={styles.mentionsHeading} id="mvp-mentions">
              {MENTIONS_HEADING}
            </h3>
            <ul className={styles.mentionList} aria-labelledby="mvp-mentions">
              {mentions.map((m) => (
                <li key={m.label} className={styles.mention}>
                  <span className={styles.mentionLabel}>{m.label}</span>
                  <span className={styles.mentionValue}>Top {m.topPercent}%</span>
                  <span className={styles.mentionLine}>{m.line}</span>
                </li>
              ))}
            </ul>
          </section>
        </SlideReveal>
      )}
    </SlideFrame>
  );
};
