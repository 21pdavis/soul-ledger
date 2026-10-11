"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { StoryStage } from "@/components/app/StoryStage";
import { SLIDES } from "@/story/copy";
import { fixtureSlideProps } from "../../../tests/fixtures/story";
import { CARD_SIDES } from "./city/tour";
import { MOOD_BOARD } from "./moodboards";
import styles from "./WorldPreview.module.css";

// The 3D never renders on the server and loads after the story is up (ADR 0068).
const WorldCanvas = dynamic(() => import("./WorldCanvas"), { ssr: false });

const props = fixtureSlideProps();
const SLIDE_IDS = SLIDES.map((s) => s.id);

/** Desktop cards sit to one side, per slide, so the scene beside them shows (see CARD_SIDES). */
const CARD_SIDE_CSS = SLIDE_IDS.map(
  (id, i) =>
    `[data-testid="story-card"][data-slide="${id}"] { margin-${CARD_SIDES[i] === "left" ? "right" : "left"}: auto; }`,
).join("\n");

/** Follows the story's current slide from the stage's data-slide, without touching the player. */
function useCurrentSlide() {
  const [slide, setSlide] = useState(0);
  useEffect(() => {
    const read = () => {
      const el = document.querySelector("[data-testid=story-stage][data-slide]");
      const i = SLIDE_IDS.indexOf(
        (el?.getAttribute("data-slide") ?? "") as (typeof SLIDE_IDS)[number],
      );
      if (i >= 0) setSlide(i);
    };
    read();
    const observer = new MutationObserver(read);
    observer.observe(document.body, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ["data-slide"],
    });
    return () => observer.disconnect();
  }, []);
  return slide;
}

export function WorldPreview() {
  const slide = useCurrentSlide();
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
      <style>{CARD_SIDE_CSS}</style>
      <div className={styles.world}>
        <WorldCanvas slide={slide} story={props.story} />
      </div>

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
