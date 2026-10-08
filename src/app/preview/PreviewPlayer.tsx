"use client";

import { StoryPlayer } from "@/components/story/StoryPlayer";
// Temporary: the fixture story stands in for a real lookup until the entry flow replaces this route.
import { fixtureSlideProps } from "../../../tests/fixtures/story";

const props = fixtureSlideProps();

export function PreviewPlayer() {
  return <StoryPlayer {...props} />;
}
