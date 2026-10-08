"use client";

import { AnimatePresence, motion, useIsPresent, type Variants } from "framer-motion";
import { SLIDES, type SlideId } from "@/story/copy";
import type { SlideProps } from "@/story/types";
import { SLIDE_COMPONENTS } from "./slides";
import styles from "./StoryPlayer.module.css";

/** Slide travel on enter and exit, in px: a nudge, not a full-width swipe. */
const TRAVEL = 48;

interface Custom {
  direction: 1 | -1;
  reduced: boolean;
}

const variants: Variants = {
  enter: ({ direction, reduced }: Custom) => ({ opacity: 0, x: reduced ? 0 : direction * TRAVEL }),
  center: { opacity: 1, x: 0 },
  exit: ({ direction, reduced }: Custom) => ({ opacity: 0, x: reduced ? 0 : -direction * TRAVEL }),
};

interface Props extends SlideProps {
  index: number;
  direction: 1 | -1;
  reduced: boolean;
  skipAnimation: boolean;
  paused: boolean;
}

function SlideHost({
  id,
  skipAnimation,
  paused,
  reducedMotion,
  ...slideProps
}: SlideProps & {
  id: SlideId;
  skipAnimation: boolean;
  paused: boolean;
  reducedMotion: boolean;
}) {
  const active = useIsPresent();
  const Slide = SLIDE_COMPONENTS[id];
  return (
    <Slide
      {...slideProps}
      active={active}
      skipAnimation={skipAnimation}
      paused={paused}
      reducedMotion={reducedMotion}
    />
  );
}

/** The current slide, sliding and fading in from the direction of travel (instant crossfade if reduced). */
export function SlideStage({
  index,
  direction,
  reduced,
  skipAnimation,
  paused,
  story,
  meta,
  actions,
}: Props) {
  const id = SLIDES[index].id;
  const custom: Custom = { direction, reduced };
  return (
    <AnimatePresence initial={false} custom={custom}>
      <motion.div
        key={id}
        className={styles.slide}
        custom={custom}
        variants={variants}
        initial="enter"
        animate="center"
        exit="exit"
        transition={reduced ? { duration: 0 } : { duration: 0.25, ease: "easeOut" }}
      >
        <SlideHost
          id={id}
          story={story}
          meta={meta}
          actions={actions}
          skipAnimation={skipAnimation}
          paused={paused}
          reducedMotion={reduced}
        />
      </motion.div>
    </AnimatePresence>
  );
}
