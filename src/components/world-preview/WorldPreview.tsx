"use client";

import { useEffect, useState } from "react";
import { StoryStage } from "@/components/app/StoryStage";
import { fixtureSlideProps } from "../../../tests/fixtures/story";
import { MOOD_BOARD } from "./moodboards";
import styles from "./WorldPreview.module.css";

/**
 * The owner's heroes stand in for the sample story's: Celeste as the main, then Paradox, Ivy,
 * Paige and The Doorman.
 */
const OWNER_HEROES = [81, 10, 20, 67, 69];
const BASE_PROPS = (() => {
  const props = fixtureSlideProps();
  const story = props.story;
  return {
    ...props,
    story: {
      ...story,
      main: story.main && { ...story.main, heroId: OWNER_HEROES[0] },
      roster: story.roster && {
        ...story.roster,
        topHeroes: story.roster.topHeroes.map((h, i) => ({
          ...h,
          heroId: OWNER_HEROES[i] ?? h.heroId,
        })),
      },
      mvp:
        story.mvp && "heroId" in story.mvp ? { ...story.mvp, heroId: OWNER_HEROES[0] } : story.mvp,
      roast: story.roast && {
        ...story.roast,
        worstMatch: story.roast.worstMatch && {
          ...story.roast.worstMatch,
          heroId: OWNER_HEROES[0],
        },
      },
    },
  };
})();

/**
 * Sample stats, with one override for trying the death map: `?deaths=x,y` (game units, about
 * ±10,000) moves where the reader dies most.
 */
function usePreviewProps() {
  const [props, setProps] = useState(BASE_PROPS);
  useEffect(() => {
    const raw = new URLSearchParams(window.location.search).get("deaths");
    const [x, y] = (raw ?? "").split(",").map(Number);
    if (!raw || !Number.isFinite(x) || !Number.isFinite(y) || !BASE_PROPS.story.roast) return;
    const deathPositions = Array.from(
      { length: 40 },
      (_, i) => [x + (i % 7) * 120, y + (i % 5) * 120] as [number, number],
    );
    // eslint-disable-next-line react-hooks/set-state-in-effect -- read once from the URL after mount
    setProps({
      ...BASE_PROPS,
      story: { ...BASE_PROPS.story, roast: { ...BASE_PROPS.story.roast, deathPositions } },
    });
  }, []);
  return props;
}
export function WorldPreview() {
  const props = usePreviewProps();
  const [boardOpen, setBoardOpen] = useState(false);
  const [storyOn, setStoryOn] = useState(true);
  const board = MOOD_BOARD;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "m") setBoardOpen((o) => !o);
      if (e.key === "h") setStoryOn((o) => !o);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className={styles.page}>
      {/* The real story stage, which carries the 3D world behind the player. */}
      <div className={styles.story} data-hidden={!storyOn}>
        <StoryStage {...props} />
      </div>

      <div className={styles.toolbar} role="toolbar" aria-label="Style preview">
        <button type="button" aria-pressed={boardOpen} onClick={() => setBoardOpen((o) => !o)}>
          Mood board (M)
        </button>
        <button type="button" aria-pressed={!storyOn} onClick={() => setStoryOn((o) => !o)}>
          {storyOn ? "Hide story (H)" : "Show story (H)"}
        </button>
      </div>

      {boardOpen && (
        <aside className={styles.board} aria-label="Mood board">
          <header>
            <h2>{board.name}</h2>
            <button type="button" onClick={() => setBoardOpen(false)} aria-label="Close mood board">
              ×
            </button>
          </header>
          <p>{board.pitch}</p>
          {board.sections.map((sec) => (
            <section key={sec.title}>
              <h3>{sec.title}</h3>
              <div className={styles.swatches}>
                {sec.palette.map((c) => (
                  <span key={c} style={{ background: c }} title={c} />
                ))}
              </div>
              <ul>
                {sec.notes.map((n) => (
                  <li key={n}>{n}</li>
                ))}
              </ul>
              <div className={styles.images}>
                {sec.images.map((img) => (
                  <figure key={img.src}>
                    {/* Hot-linked references, never committed (ADR 0068). */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img.src} alt={img.caption} referrerPolicy="no-referrer" />
                    <figcaption>{img.caption}</figcaption>
                  </figure>
                ))}
              </div>
            </section>
          ))}
          <p className={styles.credit}>
            Reference images: the City Never Sleeps update page, playdeadlock.com. © Valve.
          </p>
        </aside>
      )}
    </div>
  );
}
