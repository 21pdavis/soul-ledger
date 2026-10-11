import { describe, expect, it } from "vitest";
import { SLIDE_COUNT } from "@/story/copy";
import { initialPlayerState, reducePlayer, type PlayerState } from "@/story/slide-index";

const LAST = SLIDE_COUNT - 1;
const at = (index: number, animating = false): PlayerState => ({
  index,
  animating,
  skip: false,
  direction: 1,
});

describe("slide index logic", () => {
  it("starts on the first slide, idle", () => {
    expect(initialPlayerState).toEqual({ index: 0, animating: false, skip: false, direction: 1 });
  });

  it("start puts the opening slide into its entrance when there is motion", () => {
    expect(reducePlayer(initialPlayerState, { type: "start", motion: true })).toEqual({
      index: 0,
      animating: true,
      skip: false,
      direction: 1,
    });
  });

  it("start does nothing without motion (reduced motion), so no tap is spent on it", () => {
    expect(reducePlayer(initialPlayerState, { type: "start", motion: false })).toBe(
      initialPlayerState,
    );
  });

  it("a tap during the opening entrance completes it instead of leaving slide 1", () => {
    const started = reducePlayer(initialPlayerState, { type: "start", motion: true });
    const s = reducePlayer(started, { type: "next", motion: true });
    expect(s.index).toBe(0);
    expect(s.animating).toBe(false);
    expect(s.skip).toBe(true);
    expect(reducePlayer(s, { type: "next", motion: true }).index).toBe(1);
  });

  it("a next during the last slide's entrance completes it (the bounds check comes second)", () => {
    const s = reducePlayer(at(LAST, true), { type: "next", motion: true });
    expect(s.index).toBe(LAST);
    expect(s.animating).toBe(false);
    expect(s.skip).toBe(true);
  });

  it("a back during the first slide's entrance completes it too", () => {
    const s = reducePlayer(at(0, true), { type: "back", motion: true });
    expect(s.index).toBe(0);
    expect(s.animating).toBe(false);
    expect(s.skip).toBe(true);
  });

  it("next advances by one and starts the entrance animation", () => {
    expect(reducePlayer(at(3), { type: "next", motion: true })).toEqual({
      index: 4,
      animating: true,
      skip: false,
      direction: 1,
    });
  });

  it("back goes one slide back, with a backward direction", () => {
    const s = reducePlayer(at(3), { type: "back", motion: true });
    expect(s.index).toBe(2);
    expect(s.direction).toBe(-1);
  });

  it("next on the last slide is a no-op", () => {
    const s = at(LAST);
    expect(reducePlayer(s, { type: "next", motion: true })).toBe(s);
  });

  it("back on the first slide is a no-op", () => {
    const s = at(0);
    expect(reducePlayer(s, { type: "back", motion: true })).toBe(s);
  });

  it("never leaves 0..last however many times it is pressed", () => {
    let s = at(0);
    for (let i = 0; i < 40; i++)
      s = reducePlayer(reducePlayer(s, { type: "next", motion: false }), {
        type: "next",
        motion: false,
      });
    expect(s.index).toBe(LAST);
    for (let i = 0; i < 40; i++) s = reducePlayer(s, { type: "back", motion: false });
    expect(s.index).toBe(0);
  });

  it("a next while animating completes the animation without advancing", () => {
    const s = reducePlayer(at(3, true), { type: "next", motion: true });
    expect(s.index).toBe(3);
    expect(s.animating).toBe(false);
    expect(s.skip).toBe(true);
  });

  it("a back while animating also only completes the animation", () => {
    const s = reducePlayer(at(3, true), { type: "back", motion: true });
    expect(s.index).toBe(3);
    expect(s.animating).toBe(false);
    expect(s.skip).toBe(true);
  });

  it("the next one after completing advances, and clears the skip flag", () => {
    const completed = reducePlayer(at(3, true), { type: "next", motion: true });
    const s = reducePlayer(completed, { type: "next", motion: true });
    expect(s.index).toBe(4);
    expect(s.skip).toBe(false);
    expect(s.animating).toBe(true);
  });

  it("without motion (reduced motion) nothing is ever animating, so nothing is swallowed", () => {
    const a = reducePlayer(at(3), { type: "next", motion: false });
    expect(a.animating).toBe(false);
    expect(reducePlayer(a, { type: "next", motion: false }).index).toBe(5);
  });

  it("settled ends the animation without touching the index", () => {
    expect(reducePlayer(at(3, true), { type: "settled" })).toEqual(at(3, false));
  });

  it("goTo jumps even while animating, and records the direction", () => {
    const s = reducePlayer(at(6, true), { type: "goTo", index: 2, motion: true });
    expect(s).toEqual({ index: 2, animating: true, skip: false, direction: -1 });
  });

  it("goTo clamps out-of-range targets", () => {
    expect(reducePlayer(at(3), { type: "goTo", index: 99, motion: false }).index).toBe(LAST);
    expect(reducePlayer(at(3), { type: "goTo", index: -5, motion: false }).index).toBe(0);
  });

  it("goTo to the current slide, or to NaN, changes nothing", () => {
    const s = at(3, true);
    expect(reducePlayer(s, { type: "goTo", index: 3, motion: true })).toBe(s);
    expect(reducePlayer(s, { type: "goTo", index: Number.NaN, motion: true })).toBe(s);
  });
});
