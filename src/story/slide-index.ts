import { SLIDE_COUNT } from "./copy";

/**
 * The one slide index both controllers drive (ADR 0050), as a pure reducer.
 *
 * - `animating`: the current slide's entrance is still playing.
 * - `skip`: the entrance was cut short by a tap; slides should show their final state at once.
 * - `direction`: which way the last move went, so the slide transition can slide the right way.
 */
export interface PlayerState {
  index: number;
  animating: boolean;
  skip: boolean;
  direction: 1 | -1;
}

/**
 * `motion` is false under prefers-reduced-motion: nothing animates, so nothing can be "still
 * animating" and no tap is ever spent on completing an animation.
 *
 * `next` and `back` are the tap and key moves: while a slide is still animating they only complete
 * that animation. `goTo` is a deliberate jump (progress bar, scroll arrival) and always moves.
 */
export type PlayerAction =
  | { type: "next"; motion: boolean }
  | { type: "back"; motion: boolean }
  | { type: "goTo"; index: number; motion: boolean }
  | { type: "settled" };

export const LAST_INDEX = SLIDE_COUNT - 1;

/** How long a slide's entrance is allowed to run before taps advance again. */
export const ENTRANCE_MS = 800;

export const initialPlayerState: PlayerState = {
  index: 0,
  animating: false,
  skip: false,
  direction: 1,
};

function move(state: PlayerState, to: number, motion: boolean): PlayerState {
  return { index: to, animating: motion, skip: false, direction: to > state.index ? 1 : -1 };
}

export function reducePlayer(state: PlayerState, action: PlayerAction): PlayerState {
  switch (action.type) {
    case "next":
    case "back": {
      const to = state.index + (action.type === "next" ? 1 : -1);
      if (to < 0 || to > LAST_INDEX) return state;
      if (state.animating) return { ...state, animating: false, skip: true };
      return move(state, to, action.motion);
    }
    case "goTo": {
      if (Number.isNaN(action.index)) return state;
      const to = Math.min(Math.max(Math.round(action.index), 0), LAST_INDEX);
      return to === state.index ? state : move(state, to, action.motion);
    }
    case "settled":
      return state.animating ? { ...state, animating: false } : state;
  }
}
