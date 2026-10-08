import type { ReactNode } from "react";
import { Disclaimer } from "./Disclaimer";
import styles from "./ScreenShell.module.css";

/** The page around the entry, loading and error screens, with the non-affiliation notice. */
export function ScreenShell({ children }: { children: ReactNode }) {
  return (
    <div className={styles.shell}>
      <main className={styles.main}>{children}</main>
      <Disclaimer />
    </div>
  );
}
