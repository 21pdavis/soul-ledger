import { describe, expectTypeOf, it } from "vitest";
import type { SlideProps, StoryData } from "@/story/types";

// These checks are enforced by `pnpm typecheck` (tsc), not at runtime.
describe("story wire types", () => {
  it("keeps death positions as [x, y] pairs", () => {
    expectTypeOf<StoryData["roast"]["deathPositions"]>().toEqualTypeOf<[number, number][]>();
  });

  it("turns dates into ISO strings", () => {
    expectTypeOf<StoryData["intro"]["firstMatchAt"]>().toEqualTypeOf<string | null>();
  });

  it("gives every slide the window label data and the shared actions", () => {
    expectTypeOf<SlideProps["meta"]["window"]>().toEqualTypeOf<"all" | "patch">();
    expectTypeOf<SlideProps["meta"]["patchStart"]>().toEqualTypeOf<string | null>();
    expectTypeOf<SlideProps["meta"]["stale"]>().toEqualTypeOf<boolean>();
    expectTypeOf<SlideProps["actions"]["onRefresh"]>().toEqualTypeOf<() => void>();
    expectTypeOf<SlideProps["actions"]["onReplay"]>().toEqualTypeOf<() => void>();
    expectTypeOf<SlideProps["actions"]["onNewLookup"]>().toEqualTypeOf<() => void>();
  });
});
