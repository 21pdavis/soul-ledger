"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import {
  canShareFiles,
  linkPath,
  picturePath,
  rememberedShareSlug,
  rememberShareSlug,
  requestShareLink,
  type ShareLinkResult,
} from "@/lib/client/share";
import { SHARE_COPY } from "@/story/copy";
import type { StoryData, StoryMeta } from "@/story/types";
import styles from "./ShareButton.module.css";

interface Props {
  story: StoryData;
  meta: StoryMeta;
  /** The slide this button sits on (0-based): its picture is what gets shared. */
  index: number;
  className?: string;
}

type Notice = { kind: "status" | "alert"; text: string } | null;

/**
 * Share on one slide (ADR 0079). Phones open the native share sheet with the slide's picture and
 * the link; elsewhere a small menu offers the picture to download or the link to copy. On a shared
 * page the link already exists, so nothing is created. Failures are said calmly and never block
 * the story.
 */
export function ShareButton({ meta, index, className }: Props) {
  const [busy, setBusy] = useState(false);
  const [slug, setSlug] = useState<string | null>(null);
  const [notice, setNotice] = useState<Notice>(null);
  const trigger = useRef<HTMLButtonElement>(null);

  // A notice is for a moment, not for good.
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(null), notice.kind === "alert" ? 6000 : 4000);
    return () => clearTimeout(timer);
  }, [notice]);

  const fail = (result: Extract<ShareLinkResult, { ok: false }>) =>
    setNotice({
      kind: "alert",
      text:
        result.reason === "rate_limited"
          ? SHARE_COPY.rateLimited(result.retryAfter)
          : SHARE_COPY.failed,
    });

  const onShare = async () => {
    if (busy) return;
    if (slug) {
      // Menu already open: the button closes it.
      setSlug(null);
      return;
    }
    setNotice(null);
    setBusy(true);
    try {
      let linkSlug = meta.shared?.slug;
      if (!linkSlug && meta.accountId !== undefined) {
        linkSlug = rememberedShareSlug(meta.accountId, meta.window);
      }
      if (!linkSlug) {
        if (meta.accountId === undefined) return fail({ ok: false, reason: "failed" });
        const result = await requestShareLink(meta.accountId, meta.window);
        if (!result.ok) return fail(result);
        linkSlug = result.slug;
        rememberShareSlug(meta.accountId, meta.window, linkSlug);
      }
      const url = `${window.location.origin}${linkPath(linkSlug)}`;
      if (!canShareFiles()) {
        setSlug(linkSlug);
        return;
      }
      try {
        const response = await fetch(picturePath(linkSlug, index));
        if (!response.ok) throw new Error("picture");
        const file = new File([await response.blob()], `soul-ledger-${index + 1}.png`, {
          type: "image/png",
        });
        await navigator.share({ files: [file], url, title: SHARE_COPY.shareTitle });
      } catch (err) {
        const name = err instanceof DOMException ? err.name : "";
        // Closing the share sheet is not a failure. iOS refuses the sheet when the waits above
        // used up the tap's moment: the menu still gets the picture and link out.
        if (name === "NotAllowedError") setSlug(linkSlug);
        else if (name !== "AbortError") setNotice({ kind: "alert", text: SHARE_COPY.failed });
      }
    } finally {
      setBusy(false);
    }
  };

  const copy = async () => {
    if (!slug) return;
    const url = `${window.location.origin}${linkPath(slug)}`;
    try {
      await navigator.clipboard.writeText(url);
      setNotice({ kind: "status", text: SHARE_COPY.copied });
    } catch {
      setNotice({ kind: "alert", text: SHARE_COPY.copyFailed });
    }
    setSlug(null);
    trigger.current?.focus();
  };

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key !== "Escape" || !slug) return;
    e.preventDefault();
    e.stopPropagation();
    setSlug(null);
    trigger.current?.focus();
  };

  return (
    <div className={`${styles.share} ${className ?? ""}`} onKeyDown={onKeyDown}>
      <button
        ref={trigger}
        type="button"
        className={styles.button}
        aria-expanded={slug ? true : undefined}
        aria-busy={busy || undefined}
        onClick={onShare}
      >
        {SHARE_COPY.button}
      </button>
      {slug && (
        <div className={styles.menu} role="group" aria-label={SHARE_COPY.menuLabel}>
          <a
            className={styles.item}
            href={picturePath(slug, index)}
            download={`soul-ledger-${index + 1}.png`}
            onClick={() => {
              setSlug(null);
              trigger.current?.focus();
            }}
          >
            {SHARE_COPY.download}
          </a>
          <button type="button" className={styles.item} onClick={copy}>
            {SHARE_COPY.copyLink}
          </button>
        </div>
      )}
      {/* Always in the page (visually hidden when empty), or screen readers miss what is added. */}
      <p
        className={notice?.kind === "status" ? styles.notice : styles.quiet}
        aria-live="polite"
        data-testid="share-status"
      >
        {notice?.kind === "status" ? notice.text : ""}
      </p>
      {notice?.kind === "alert" && (
        <p className={styles.notice} role="alert" data-kind="alert">
          {notice.text}
        </p>
      )}
    </div>
  );
}
