"use client";

import { useEffect, useState } from "react";
import { DISMISS, STALE_NOTE } from "@/story/copy";
import styles from "./StaleNote.module.css";

/**
 * Shown over the empty band of the first slide when a refresh failed and the matches come from an
 * earlier visit. It takes no layout space, so the stage keeps its full size (#38), and it can be
 * dismissed (keyboard included); StoryStage holds the dismissed state so a layout switch keeps it.
 * The live region is mounted empty and filled after mount, so screen readers announce the text.
 */
export function StaleNote({ onDismiss }: { onDismiss: () => void }) {
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const id = setTimeout(() => setShown(true), 0);
    return () => clearTimeout(id);
  }, []);
  return (
    <div role="status" className={shown ? styles.note : undefined}>
      {shown && (
        <>
          <p className={styles.text}>{STALE_NOTE}</p>
          <button type="button" className={styles.dismiss} onClick={onDismiss}>
            {DISMISS}
          </button>
        </>
      )}
    </div>
  );
}
