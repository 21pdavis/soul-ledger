import type { ReactNode } from "react";
import { ENTRY_COPY } from "@/story/copy-entry";
import styles from "./ScreenShell.module.css";

/** The page around the entry, loading and error screens, with the non-affiliation notice. */
export function ScreenShell({ children }: { children: ReactNode }) {
  return (
    <div className={styles.shell}>
      <main className={styles.main}>{children}</main>
      <footer className={styles.footer}>
        <small>{ENTRY_COPY.disclaimer}</small>
      </footer>
    </div>
  );
}
