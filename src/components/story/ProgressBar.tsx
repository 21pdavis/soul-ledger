import styles from "./ProgressBar.module.css";

interface Props {
  count: number;
  current: number;
  /** When given, each segment is a button (desktop progress-bar clicks, keyboard). */
  onSelect?: (index: number) => void;
}

/** Segmented story progress: one segment per slide, filled up to the current one. */
export function ProgressBar({ count, current, onSelect }: Props) {
  return (
    <ol className={styles.bar} aria-label="Story progress">
      {Array.from({ length: count }, (_, i) => {
        const state = i < current ? "done" : i === current ? "current" : "todo";
        return (
          <li
            key={i}
            className={styles.segment}
            data-state={state}
            aria-current={state === "current" ? "step" : undefined}
          >
            {onSelect ? (
              <button
                type="button"
                className={styles.hit}
                aria-label={`Go to slide ${i + 1}`}
                aria-current={state === "current" ? "step" : undefined}
                onClick={() => onSelect(i)}
              />
            ) : (
              <span className={styles.visuallyHidden}>{`Slide ${i + 1} of ${count}`}</span>
            )}
          </li>
        );
      })}
    </ol>
  );
}
