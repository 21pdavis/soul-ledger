import { ENTRY_COPY } from "@/story/copy-entry";
import styles from "./Disclaimer.module.css";

/** The Valve non-affiliation notice (ADR 0016). Shown on every screen, the story included. */
export function Disclaimer() {
  return (
    <footer className={styles.disclaimer}>
      <small>{ENTRY_COPY.disclaimer}</small>
    </footer>
  );
}
