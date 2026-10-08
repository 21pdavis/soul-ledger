"use client";

import { animate, motion, useMotionValue, useTransform } from "framer-motion";
import { useEffect, useState } from "react";
import { loadingStage } from "@/lib/client/loading-stage";
import type { ClientLookupEvent } from "@/lib/client/lookup-stream";
import { usePrefersReducedMotion } from "@/components/story/useMediaQuery";
import { LOADING_COPY } from "@/story/copy";
import styles from "./LoadingScreen.module.css";

interface Props {
  /** The progress events received so far, in order (never the final story or error). */
  progress: ClientLookupEvent[];
}

/** Hero tiles shown before the rest are counted ("+8 more"). */
const MAX_TILES = 12;

const format = (n: number) => Math.round(n).toLocaleString("en-US");

function CountingNumber({ value }: { value: number }) {
  const shown = useMotionValue(0);
  const text = useTransform(shown, format);
  useEffect(() => {
    const controls = animate(shown, value, { duration: 0.6, ease: "easeOut" });
    return () => controls.stop();
  }, [value, shown]);
  return <motion.span>{text}</motion.span>;
}

/** A number that counts up to its value, or just shows it when motion is reduced. */
function CountUp({ value, reduced }: { value: number; reduced: boolean }) {
  return reduced ? <span>{format(value)}</span> : <CountingNumber value={value} />;
}

/** The Steam avatar in its octagon, or a placeholder sigil if there is none or it fails to load. */
function Avatar({ url }: { url: string | null }) {
  const [failed, setFailed] = useState(false);
  return (
    <span className={styles.avatar}>
      {url && !failed ? (
        // eslint-disable-next-line @next/next/no-img-element -- a Steam CDN avatar, not ours to optimise
        <img src={url} alt="" referrerPolicy="no-referrer" onError={() => setFailed(true)} />
      ) : (
        <i aria-hidden />
      )}
    </span>
  );
}

/**
 * The staged loader (ADR 0014, 0052). It is a ledger page whose three entries fill in as the
 * real lookup events arrive: the profile, the match history with hero tiles, then the live
 * tally of match details. It never advances on a timer. Screen readers hear one polite line per
 * stage change; the animated counters stay out of the live region.
 */
export function LoadingScreen({ progress }: Props) {
  const view = loadingStage(progress);
  const reduced = usePrefersReducedMotion();
  const { profile, history, details } = view;
  // With reduced motion, everything is already in its final state: no entrance, no stagger.
  const enter = (extra: object = {}) =>
    reduced
      ? { initial: false as const }
      : { initial: { opacity: 0, y: 6 }, animate: { opacity: 1, y: 0 }, transition: extra };

  // The visible twin of the announcement, for the moments between stages.
  const note = view.done
    ? LOADING_COPY.sealing
    : view.waiting
      ? LOADING_COPY.waiting
      : view.stage === 0
        ? LOADING_COPY.title
        : null;

  const tiles = history?.heroes.slice(0, MAX_TILES) ?? [];
  const hiddenHeroes = (history?.heroes.length ?? 0) - tiles.length;

  return (
    <div className={styles.page} data-stage={view.stage} data-waiting={view.waiting || undefined}>
      <h1 className={styles.srOnly}>{LOADING_COPY.pageHeading}</h1>
      <p role="status" aria-live="polite" aria-atomic="true" className={styles.announce}>
        {view.announcement}
      </p>

      <div className={styles.sheet}>
        <ol className={styles.entries}>
          <li className={styles.entry} data-state={profile ? "filled" : "blank"}>
            <h2 className={styles.heading}>{LOADING_COPY.entries.profile}</h2>
            {profile ? (
              <motion.div className={styles.profile} {...enter({ duration: 0.4 })}>
                <Avatar key={profile.avatarUrl} url={profile.avatarUrl} />
                <div>
                  {profile.name && <p className={styles.name}>{profile.name}</p>}
                  <p className={styles.teaser}>{LOADING_COPY.profileTeaser(profile.name)}</p>
                </div>
              </motion.div>
            ) : (
              <span className={styles.blank} aria-hidden />
            )}
          </li>

          <li className={styles.entry} data-state={history ? "filled" : "blank"}>
            <h2 className={styles.heading}>{LOADING_COPY.entries.history}</h2>
            {history ? (
              <motion.div {...enter({ duration: 0.4 })}>
                <p className={styles.figure}>{history.summary}</p>
                {tiles.length > 0 && (
                  <>
                    <ul className={styles.tiles} aria-label={LOADING_COPY.heroesLabel}>
                      {tiles.map((hero, i) => (
                        <motion.li
                          key={hero.id}
                          className={styles.tile}
                          title={hero.name}
                          {...(reduced
                            ? { initial: false as const }
                            : {
                                initial: { opacity: 0 },
                                // A neon sign catching: on, dim, on.
                                animate: { opacity: [0, 1, 0.35, 1] },
                                transition: { delay: 0.1 + i * 0.07, duration: 0.45 },
                              })}
                        >
                          <span className={styles.monogram} aria-hidden="true">
                            {hero.monogram}
                          </span>
                          <span className={styles.srOnly}>{hero.name}</span>
                        </motion.li>
                      ))}
                      {hiddenHeroes > 0 && (
                        <li className={styles.more}>{LOADING_COPY.heroesMore(hiddenHeroes)}</li>
                      )}
                    </ul>
                    <p className={styles.teaser}>{LOADING_COPY.historyTeaser}</p>
                  </>
                )}
              </motion.div>
            ) : (
              <span className={styles.blank} aria-hidden />
            )}
          </li>

          <li className={styles.entry} data-state={details ? "filled" : "blank"}>
            <h2 className={styles.heading}>{LOADING_COPY.entries.details}</h2>
            {details ? (
              <motion.div {...enter({ duration: 0.4 })}>
                {details.total > 0 ? (
                  <>
                    <p className={styles.counter}>
                      <span className={styles.count}>
                        <CountUp value={details.fetched} reduced={reduced} />
                      </span>
                      <span className={styles.of}>/ {details.total.toLocaleString("en-US")}</span>
                      <span className={styles.unit}>{LOADING_COPY.tally.fetched}</span>
                    </p>
                    <div
                      className={styles.track}
                      role="progressbar"
                      aria-label={LOADING_COPY.detailsLabel}
                      aria-valuemin={0}
                      aria-valuemax={details.total}
                      aria-valuenow={Math.min(details.fetched, details.total)}
                    >
                      <motion.div
                        className={styles.fill}
                        initial={false}
                        animate={{ scaleX: details.fraction }}
                        transition={reduced ? { duration: 0 } : { duration: 0.5, ease: "easeOut" }}
                      />
                    </div>
                    <dl className={styles.tally}>
                      <div>
                        <dt>{LOADING_COPY.tally.kills}</dt>
                        <dd>
                          <CountUp value={details.kills} reduced={reduced} />
                        </dd>
                      </div>
                      <div>
                        <dt>{LOADING_COPY.tally.breakables}</dt>
                        <dd>
                          <CountUp value={details.breakables} reduced={reduced} />
                        </dd>
                      </div>
                    </dl>
                    <p className={styles.teaser}>{LOADING_COPY.detailsTeaser}</p>
                  </>
                ) : (
                  <p className={styles.teaser}>{LOADING_COPY.nothingToRead}</p>
                )}
              </motion.div>
            ) : (
              <span className={styles.blank} aria-hidden />
            )}
          </li>
        </ol>
        {note && (
          <p className={styles.note} aria-hidden="true">
            {note}
          </p>
        )}
      </div>
    </div>
  );
}
