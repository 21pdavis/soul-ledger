import { describe, expect, it } from "vitest";
import { currentPatchStart } from "@/lib/patches";
import { patchEntry } from "@/lib/deadlock-api/schemas";
import { fixtureJson } from "../helpers/fixtures";

const patches = patchEntry.array().parse(fixtureJson("api/patches.json"));

describe("currentPatchStart", () => {
  it("reads the patch date from the newest changelog title, not its edit date", () => {
    // Titled 09-29-2026 but last edited 2026-10-05.
    expect(currentPatchStart(patches)).toEqual(new Date("2026-09-29T00:00:00Z"));
  });

  it("picks the newest patch whatever the list order", () => {
    expect(currentPatchStart([...patches].reverse())).toEqual(new Date("2026-09-29T00:00:00Z"));
  });

  it("falls back to the publish date when a title has no date", () => {
    expect(
      currentPatchStart([{ title: "Big Hero Update", pub_date: "2026-10-01T18:00:00Z" }]),
    ).toEqual(new Date("2026-10-01T18:00:00Z"));
  });

  it("returns null with no patches", () => {
    expect(currentPatchStart([])).toBeNull();
  });
});
