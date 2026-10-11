/**
 * On desktop with the 3D world behind the story, which side of the screen each slide's card sits
 * on, in story order (ADR 0069). The camera frames each scene in the open space on the other side,
 * and the zig-zag makes the scroll down the stack weave.
 */
export type CardSide = "left" | "right";

export const CARD_SIDES: CardSide[] = [
  "left", // intro
  "right", // main
  "left", // roster
  "right", // scavenger
  "left", // kills
  "right", // precision
  "left", // mid boss
  "right", // roast
  "left", // rank
  "right", // mvp
  "left", // summary
];
