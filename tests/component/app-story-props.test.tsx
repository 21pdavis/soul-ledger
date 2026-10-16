import { screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SlideProps } from "@/story/types";
import { basedOnMatches, windowLabel } from "@/story/window-label";
import { PATCH, URL_A, ndjson, setup, storyEvent } from "./app-harness";

// What App hands the story player (window, matches, actions), seen through a stand-in player that
// shows those props. The real slides own the window label and the Refresh / new-lookup buttons
// (M2 PRs 5-8), so until they exist this is where App's side of that contract is tested.
vi.mock("@/components/story/StoryPlayer", () => ({
  StoryPlayer: ({ story, meta, actions }: SlideProps) => (
    <div data-testid="story-player">
      <p>{windowLabel(meta)}</p>
      <p>{basedOnMatches(story.matchCount)}</p>
      <button onClick={actions.onRefresh}>Refresh</button>
      <button onClick={actions.onNewLookup}>Look up another player</button>
    </div>
  ),
}));

beforeEach(() => localStorage.clear());

describe("App to story player props", () => {
  it("tells the story which window it covers: All time", async () => {
    const { enter } = setup(ndjson(storyEvent()));
    await enter();
    expect(await screen.findByText("All time")).toBeInTheDocument();
    expect(screen.getByText(/120 matches/)).toBeInTheDocument();
  });

  it("tells the story which patch, from the server's patch date", async () => {
    const { enter, user } = setup(ndjson(storyEvent({ window: "patch", patchStart: PATCH })));
    await user.click(screen.getByRole("radio", { name: "This patch" }));
    await enter();
    expect(await screen.findByText("Since patch Sep 30, 2026")).toBeInTheDocument();
  });

  it("labels the story All time when a patch window came back without a patch date (#25)", async () => {
    const { enter, user } = setup(ndjson(storyEvent({ window: "patch", patchStart: null })));
    await user.click(screen.getByRole("radio", { name: "This patch" }));
    await enter();
    await screen.findByTestId("story-player");
    expect(screen.getByText(/^All time/)).toBeInTheDocument();
    expect(screen.queryByText(/this patch/i)).not.toBeInTheDocument();
  });

  it("Refresh reruns the lookup with refresh=1 and the same window", async () => {
    const { enter, user, requested, fetchMock } = setup(
      ndjson(storyEvent({ window: "patch", patchStart: PATCH })),
      ndjson(storyEvent({ window: "patch", patchStart: PATCH })),
    );
    await user.click(screen.getByRole("radio", { name: "This patch" }));
    await enter();
    await user.click(await screen.findByRole("button", { name: "Refresh" }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    expect(requested(1).searchParams.get("refresh")).toBe("1");
    expect(requested(1).searchParams.get("window")).toBe("patch");
    expect(requested(1).searchParams.get("q")).toBe(URL_A);
    expect(await screen.findByTestId("story-player")).toBeInTheDocument();
  });

  it("Look up another player returns to the entry screen", async () => {
    const { enter, user } = setup(ndjson(storyEvent()));
    await enter();
    await user.click(await screen.findByRole("button", { name: "Look up another player" }));
    expect(screen.getByLabelText("Paste your Steam profile URL")).toHaveValue(URL_A);
    expect(screen.queryByTestId("story-player")).not.toBeInTheDocument();
  });

  it("Look up another player puts focus on the entry title, so Tab goes on to the URL box", async () => {
    const { enter, user } = setup(ndjson(storyEvent()));
    await enter();
    await user.click(await screen.findByRole("button", { name: "Look up another player" }));
    expect(screen.getByRole("heading", { level: 1 })).toHaveFocus();
    await user.tab();
    expect(screen.getByLabelText("Paste your Steam profile URL")).toHaveFocus();
  });

  it("does not move focus on the first visit to the entry screen", () => {
    setup();
    expect(document.body).toHaveFocus();
  });
});
