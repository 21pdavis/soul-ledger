"use client";

import { StoryPlayer } from "@/components/story/StoryPlayer";
// TECH DEBT (#29): temporary. App code importing test fixtures is a shortcut; remove this file and
// the /preview route once the entry flow is integrated with the player.
import { fixtureSlideProps } from "../../../tests/fixtures/story";

const props = fixtureSlideProps();

export function PreviewPlayer() {
  return <StoryPlayer {...props} />;
}
