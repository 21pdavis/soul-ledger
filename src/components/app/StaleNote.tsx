"use client";

import { useState } from "react";
import { DISMISS, STALE_NOTE } from "@/story/copy-entry";
import styles from "./StaleNote.module.css";

/**
 * Shown after the story when a refresh failed and the matches come from an earlier visit. It sits
 * in the page flow (never over the story) and can be dismissed.
 */
export function StaleNote() {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;
  return (
    <div role="status" className={styles.note}>
      <p className={styles.text}>{STALE_NOTE}</p>
      <button type="button" className={styles.dismiss} onClick={() => setDismissed(true)}>
        {DISMISS}
      </button>
    </div>
  );
}
