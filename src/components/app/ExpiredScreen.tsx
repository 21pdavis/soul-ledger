import { useEffect, useRef } from "react";
import { SHARED_COPY } from "@/story/copy";
import styles from "./ErrorScreen.module.css";

/** A share link past its 90 days (ADR 0079): the frozen story is gone, the live one is not. */
export function ExpiredScreen({
  onSeeLatest,
  onLookUpOwn,
}: {
  onSeeLatest: () => void;
  onLookUpOwn: () => void;
}) {
  const title = useRef<HTMLHeadingElement>(null);
  useEffect(() => title.current?.focus(), []);
  return (
    <div className={styles.screen}>
      <h1 ref={title} tabIndex={-1} className={styles.title}>
        {SHARED_COPY.expiredTitle}
      </h1>
      <p className={styles.body}>{SHARED_COPY.expiredBody}</p>
      <div className={styles.actions}>
        <button type="button" className={styles.primary} onClick={onSeeLatest}>
          {SHARED_COPY.seeLatest}
        </button>
        <button type="button" className={styles.secondary} onClick={onLookUpOwn}>
          {SHARED_COPY.lookUpOwn}
        </button>
      </div>
    </div>
  );
}
