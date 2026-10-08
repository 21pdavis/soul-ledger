import type { ClientLookupEvent } from "@/lib/client/lookup-stream";
import { LOADING_COPY } from "@/story/copy-entry";
import styles from "./LoadingScreen.module.css";

interface Props {
  /**
   * The progress events received so far, in order (never the final story or error). PR 3 (staged
   * loading) turns these into the three real stages; this placeholder only says it is working.
   */
  progress: ClientLookupEvent[];
}

/** Placeholder loading screen; PR 3 replaces it with the staged loader. */
export function LoadingScreen({ progress }: Props) {
  void progress;
  return (
    <div className={styles.loading} role="status">
      <span className={styles.mark} aria-hidden="true" />
      <p className={styles.text}>{LOADING_COPY.title}</p>
    </div>
  );
}
