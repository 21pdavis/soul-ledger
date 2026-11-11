import Link from "next/link";
import { SHARED_COPY } from "@/story/copy";
import styles from "./ErrorScreen.module.css";
import { ScreenShell } from "./ScreenShell";

/** An unknown address (a mistyped or removed share link). Says nothing about any player. */
export function NotFoundScreen() {
  return (
    <ScreenShell>
      <div className={styles.screen}>
        <h1 className={styles.title}>{SHARED_COPY.notFoundTitle}</h1>
        <p className={styles.body}>{SHARED_COPY.notFoundBody}</p>
        <div className={styles.actions}>
          <Link href="/" className={`${styles.primary} ${styles.linkButton}`}>
            {SHARED_COPY.lookUpOwn}
          </Link>
        </div>
      </div>
    </ScreenShell>
  );
}
