"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { StoryStage } from "@/components/app/StoryStage";
import { SLIDES } from "@/story/copy";
import { fixtureSlideProps } from "../../../tests/fixtures/story";
import { MOOD_BOARDS, type WorldId } from "./moodboards";
import styles from "./WorldPreview.module.css";

// The 3D never renders on the server and loads after the story is up (ADR 0068).
const WorldCanvas = dynamic(() => import("./WorldCanvas"), { ssr: false });

const props = fixtureSlideProps();
const SLIDE_IDS = SLIDES.map((s) => s.id);

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
  const [world, setWorld] = useState<WorldId>("street");
  const [boardOpen, setBoardOpen] = useState(false);
  const [storyOn, setStoryOn] = useState(true);
  const board = MOOD_BOARDS.find((b) => b.id === world)!;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const i = ["1", "2", "3"].indexOf(e.key);
      if (i >= 0) setWorld(MOOD_BOARDS[i].id);
      if (e.key === "m") setBoardOpen((o) => !o);
      if (e.key === "h") setStoryOn((o) => !o);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className={styles.page} data-world={world}>
      <div className={styles.world}>
        <WorldCanvas world={world} slide={slide} heroId={props.story.main?.heroId ?? 1} />
      </div>

      <div className={styles.story} data-hidden={!storyOn}>
        <StoryStage {...props} />
      </div>

      <div className={styles.toolbar} role="toolbar" aria-label="Style preview">
        {MOOD_BOARDS.map((b, i) => (
          <button
            key={b.id}
            type="button"
            aria-pressed={b.id === world}
            onClick={() => setWorld(b.id)}
            title={`${b.name} (key ${i + 1})`}
          >
            {i + 1}. {b.name}
          </button>
        ))}
        <button type="button" aria-pressed={boardOpen} onClick={() => setBoardOpen((o) => !o)}>
          Mood board
        </button>
        <button type="button" aria-pressed={!storyOn} onClick={() => setStoryOn((o) => !o)}>
          {storyOn ? "Hide story" : "Show story"}
        </button>
      </div>

      {boardOpen && (
        <aside className={styles.board} aria-label={`${board.name} mood board`}>
          <header>
            <h2>{board.name}</h2>
            <button type="button" onClick={() => setBoardOpen(false)} aria-label="Close mood board">
              ×
            </button>
          </header>
          <p>{board.pitch}</p>
          <div className={styles.swatches}>
            {board.palette.map((c) => (
              <span key={c} style={{ background: c }} title={c} />
            ))}
          </div>
          <ul>
            {board.notes.map((n) => (
              <li key={n}>{n}</li>
            ))}
          </ul>
          <div className={styles.images}>
            {board.images.map((img) => (
              <figure key={img.src + img.caption}>
                {/* Hot-linked references, never committed (ADR 0068). */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img.src} alt={img.caption} referrerPolicy="no-referrer" />
                <figcaption>{img.caption}</figcaption>
              </figure>
            ))}
          </div>
          <p className={styles.credit}>Reference images: Deadlock on Steam, © Valve.</p>
        </aside>
      )}
    </div>
  );
}
