import type { ReactNode } from "react";
import styles from "./SlideFrame.module.css";

interface Props {
  headline: string;
  children: ReactNode;
}

/** The deco frame every slide sits in: a headline over the slide's own content. */
export function SlideFrame({ headline, children }: Props) {
  return (
    <section className={styles.frame}>
      <h2 className={styles.headline}>{headline}</h2>
      <div className={styles.body}>{children}</div>
    </section>
  );
}
