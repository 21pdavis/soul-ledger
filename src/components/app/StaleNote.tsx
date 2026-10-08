import { STALE_NOTE } from "@/story/copy-entry";
import styles from "./StaleNote.module.css";

/** Shown over the story when a refresh failed and the matches come from an earlier visit. */
export function StaleNote() {
  return (
    <p role="status" className={styles.note}>
      {STALE_NOTE}
    </p>
  );
}
