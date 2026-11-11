import { useId, type ReactNode } from "react";
import styles from "./SlideFrame.module.css";

interface Props {
  headline: string;
  /** A small gold label above the headline (the shared first slide names whose story it is). */
  eyebrow?: string;
  children: ReactNode;
}

/** The deco frame every slide sits in: a headline over the slide's own content. */
export function SlideFrame({ headline, eyebrow, children }: Props) {
  const headingId = useId();
  return (
    <section className={styles.frame} aria-labelledby={headingId}>
      <div className={styles.inner}>
        <header className={styles.head}>
          {eyebrow && <p className={styles.eyebrow}>{eyebrow}</p>}
          <h2 id={headingId} className={styles.headline}>
            {headline}
          </h2>
        </header>
        <div className={styles.body}>{children}</div>
      </div>
    </section>
  );
}
