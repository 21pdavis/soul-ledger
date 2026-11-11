import Link from "next/link";
import styles from "./ErrorScreen.module.css";
import { ScreenShell } from "./ScreenShell";

/** An unknown address. Says nothing about any player. */
export function NotFoundScreen({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action: string;
}) {
  return (
    <ScreenShell>
      <div className={styles.screen}>
        <h1 className={styles.title}>{title}</h1>
        <p className={styles.body}>{body}</p>
        <div className={styles.actions}>
          <Link href="/" className={`${styles.primary} ${styles.linkButton}`}>
            {action}
          </Link>
        </div>
      </div>
    </ScreenShell>
  );
}
