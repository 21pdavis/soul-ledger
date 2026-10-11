import { cleanup, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { App } from "@/components/app/App";
import { PREFS_KEY } from "@/lib/client/prefs";
import { fixtureStory } from "../fixtures/story";
import { PATCH, URL_A, ndjson, setup, storyEvent, storyGone, storyUp } from "./app-harness";

beforeEach(() => localStorage.clear());

describe("App flow", () => {
  it("starts on the entry screen, with the Valve disclaimer", () => {
    setup();
    expect(screen.getByLabelText("Paste your Steam profile URL")).toBeInTheDocument();
    expect(
      screen.getByText(/Valve and its properties are trademarks of Valve Corporation/),
    ).toBeInTheDocument();
    expect(screen.getByText(/Not affiliated with or endorsed by Valve/)).toBeInTheDocument();
  });

  it("shows a loading screen while the lookup runs, then the story", async () => {
    let finish!: (r: Response) => void;
    const { enter } = setup(new Promise<Response>((resolve) => (finish = resolve)));
    await enter();
    expect(await screen.findByRole("status")).toHaveTextContent(/Looking up your ledger/);
    expect(screen.queryByLabelText("Paste your Steam profile URL")).not.toBeInTheDocument();
    finish(ndjson({ type: "resolved", accountId: 1 }, storyEvent()));
    expect(await storyUp()).toBeInTheDocument();
  });

  it("moves through the loading stages as the lookup streams events, then shows the story", async () => {
    const encoder = new TextEncoder();
    let push!: (event: unknown) => void;
    let close!: () => void;
    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        push = (event) => controller.enqueue(encoder.encode(JSON.stringify(event) + "\n"));
        close = () => controller.close();
      },
    });
    const { enter } = setup(new Response(body));
    await enter();
    push({ type: "resolved", accountId: 1 });
    expect(await screen.findByRole("status")).toHaveTextContent(/Looking up your ledger/);
    push({ type: "profile", accountId: 1, personaName: "Gaben", avatarUrl: null });
    expect(await screen.findByText(/Found you, Gaben/)).toBeInTheDocument();
    push({ type: "history", totalMatches: 120, newMatches: 120, heroIds: [1, 2] });
    expect(await screen.findByText("120 matches on the books")).toBeInTheDocument();
    push({
      type: "details",
      fetched: 50,
      total: 100,
      kills: 400,
      breakables: 150,
      sinnerJackpots: 0,
    });
    expect(await screen.findByRole("progressbar")).toHaveAttribute("aria-valuenow", "50");
    storyGone();
    push(storyEvent());
    close();
    expect(await storyUp()).toBeInTheDocument();
  });

  it("sends the pasted URL and the all-time window by default", async () => {
    const { enter, requested } = setup(ndjson(storyEvent()));
    await enter();
    await storyUp();
    expect(requested().searchParams.get("q")).toBe(URL_A);
    expect(requested().searchParams.get("window")).toBe("all");
    expect(requested().searchParams.has("refresh")).toBe(false);
  });

  it("sends window=patch when This patch is chosen", async () => {
    const { enter, requested, user } = setup(
      ndjson(storyEvent({ window: "patch", patchStart: PATCH })),
    );
    await user.click(screen.getByRole("radio", { name: "This patch" }));
    await enter();
    await storyUp();
    expect(requested().searchParams.get("window")).toBe("patch");
  });

  it("remembers the URL and window, and restores them next visit", async () => {
    const { enter, user } = setup(ndjson(storyEvent({ window: "patch", patchStart: PATCH })));
    await user.click(screen.getByRole("radio", { name: "This patch" }));
    await enter();
    await storyUp();
    expect(JSON.parse(localStorage.getItem(PREFS_KEY)!)).toEqual({
      url: URL_A,
      filters: { window: "patch" },
    });
    // A fresh page load reads them back.
    cleanup();
    render(<App />);
    expect(screen.getByLabelText("Paste your Steam profile URL")).toHaveValue(URL_A);
    expect(screen.getByRole("radio", { name: "This patch" })).toBeChecked();
  });

  it("works when storage is unavailable", async () => {
    const getItem = vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new DOMException("denied", "SecurityError");
    });
    const setItem = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("full", "QuotaExceededError");
    });
    try {
      const { enter } = setup(ndjson(storyEvent()));
      await enter();
      expect(await storyUp()).toBeInTheDocument();
    } finally {
      getItem.mockRestore();
      setItem.mockRestore();
    }
  });

  it("not_found shows its full-screen state and lets you try another profile", async () => {
    const { enter, user } = setup(ndjson({ type: "error", reason: "not_found" }));
    await enter();
    expect(
      await screen.findByRole("heading", { name: "We couldn't find that profile" }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Try another profile" }));
    expect(screen.getByLabelText("Paste your Steam profile URL")).toHaveValue(URL_A);
  });

  it("an input the server rejects shows the invalid screen", async () => {
    const { enter } = setup(ndjson({ type: "error", reason: "invalid" }));
    await enter();
    expect(await screen.findByRole("button", { name: "Try another link" })).toBeInTheDocument();
  });

  it.each([
    ["an unavailable event", () => ndjson({ type: "error", reason: "unavailable" })],
    ["a network failure", () => new TypeError("Failed to fetch")],
  ])("%s shows the retry screen, and retry reruns the same lookup", async (_name, failure) => {
    const { enter, user, fetchMock, requested } = setup(failure(), ndjson(storyEvent()));
    await user.click(screen.getByRole("radio", { name: "This patch" }));
    await enter();
    await user.click(await screen.findByRole("button", { name: "Try again" }));
    expect(await storyUp()).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(requested(1).searchParams.get("q")).toBe(URL_A);
    expect(requested(1).searchParams.get("window")).toBe("patch");
  });

  it("never mounts the story when there are zero matches", async () => {
    const empty = fixtureStory({ matchCount: 0, main: null, mvp: null });
    const { enter } = setup(ndjson(storyEvent({}, empty)));
    await enter();
    expect(await screen.findByRole("heading", { name: "No Deadlock matches found" })).toBeVisible();
    storyGone();
  });

  it("treats a Street Brawl-only player as zero matches", async () => {
    const brawl = fixtureStory({ matchCount: 0, excludedMatches: 14, main: null, mvp: null });
    const { enter } = setup(ndjson(storyEvent({}, brawl)));
    await enter();
    expect(await screen.findByText(/14 games/)).toBeInTheDocument();
    storyGone();
  });

  it("zero matches in the patch window mentions the latest patch", async () => {
    const empty = fixtureStory({ matchCount: 0, main: null, mvp: null });
    const { enter, user } = setup(
      ndjson(storyEvent({ window: "patch", patchStart: PATCH }, empty)),
    );
    await user.click(screen.getByRole("radio", { name: "This patch" }));
    await enter();
    expect(await screen.findByText(/no matches since the latest patch/i)).toBeInTheDocument();
  });

  it("shows a cached-matches note when the story is stale, and not otherwise", async () => {
    const { enter } = setup(ndjson(storyEvent({ stale: true })));
    await enter();
    expect(await screen.findByText(/showing cached matches/i)).toBeInTheDocument();
  });

  it("zero matches after a patch request that fell back to all time does not blame the patch (#25)", async () => {
    const empty = fixtureStory({ matchCount: 0, main: null, mvp: null });
    const { enter, user } = setup(ndjson(storyEvent({ window: "patch", patchStart: null }, empty)));
    await user.click(screen.getByRole("radio", { name: "This patch" }));
    await enter();
    expect(await screen.findByRole("heading", { name: "No Deadlock matches found" })).toBeVisible();
    expect(screen.queryByText(/since the latest patch/i)).not.toBeInTheDocument();
  });

  it("keeps the Valve notice on screen while the story plays", async () => {
    const { enter } = setup(ndjson(storyEvent()));
    await enter();
    await storyUp();
    expect(screen.getByText(/Not affiliated with or endorsed by Valve/)).toBeInTheDocument();
  });

  it("puts the cached-matches note after the story, where it cannot cover it, and lets you dismiss it", async () => {
    const { enter, user } = setup(ndjson(storyEvent({ stale: true })));
    await enter();
    const note = (await screen.findByText(/showing cached matches/i)).closest("[role=status]")!;
    const story = screen.getByTestId("story-player");
    expect(story.compareDocumentPosition(note) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Dismiss" }));
    expect(screen.queryByText(/cached matches/i)).not.toBeInTheDocument();
  });

  it("shows no cached-matches note for a fresh story", async () => {
    const { enter } = setup(ndjson(storyEvent()));
    await enter();
    await storyUp();
    expect(screen.queryByText(/cached matches/i)).not.toBeInTheDocument();
  });

  it("gives the story page one h1 inside main, above the slide headlines", async () => {
    const { enter } = setup(ndjson(storyEvent()));
    await enter();
    await storyUp();
    const h1s = screen.getAllByRole("heading", { level: 1 });
    expect(h1s).toHaveLength(1);
    expect(h1s[0]).toHaveTextContent("Your Soul Ledger story");
    expect(screen.getByRole("main")).toContainElement(h1s[0]);
  });

  it("plays the real story: 11 segments with the first current, and a tap moves on", async () => {
    const { enter, user } = setup(ndjson(storyEvent()));
    await enter();
    const bar = await storyUp();
    const segments = within(bar).getAllByRole("listitem");
    expect(segments).toHaveLength(11);
    expect(segments[0]).toHaveAttribute("data-state", "current");
    expect(screen.queryByText(/story player arrives in a later PR/i)).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Welcome back to the Cursed Apple" })).toBeVisible();
    await user.click(screen.getByTestId("tap-zone-next")); // completes the opening entrance
    await user.click(screen.getByTestId("tap-zone-next"));
    expect(segments[1]).toHaveAttribute("data-state", "current");
  });
});
