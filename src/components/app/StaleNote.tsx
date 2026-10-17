"use client";

import { useState } from "react";
import { DISMISS, STALE_NOTE } from "@/story/copy";
import styles from "./StaleNote.module.css";

/**
 * Shown over the top edge of the story stage, just under the progress bar, when a refresh failed
 * and the matches come from an earlier visit. It takes no layout space, so the stage keeps its
 * full size (#38), and it can be dismissed (keyboard included). role="status" announces it politely.
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
