import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { App } from "@/components/app/App";
import { PREFS_KEY } from "@/lib/client/prefs";
import { fixtureStory } from "../fixtures/story";

const URL_A = "https://steamcommunity.com/id/gaben";
const PATCH = "2026-09-30T00:00:00.000Z";

const ndjson = (...events: unknown[]) =>
  new Response(events.map((e) => JSON.stringify(e) + "\n").join(""), {
    headers: { "content-type": "application/x-ndjson" },
  });

const storyEvent = (over: Record<string, unknown> = {}, story = fixtureStory()) => ({
  type: "story",
  player: { accountId: 1, personaName: "Gaben", avatarUrl: null },
  window: "all",
  patchStart: null,
  stale: false,
  story,
  ...over,
});

function setup(...responses: (Response | Promise<Response> | Error)[]) {
  const queue = [...responses];
  const fetchMock = vi.fn(async (url: RequestInfo | URL) => {
    void url; // typed so that mock.calls[n][0] is the requested URL
    const next = queue.shift();
    if (next instanceof Error) throw next;
    return next ?? ndjson({ type: "error", reason: "unavailable" });
  });
  const user = userEvent.setup();
  render(<App fetchImpl={fetchMock as unknown as typeof fetch} />);
  const requested = (n = 0) => new URL(String(fetchMock.mock.calls[n][0]), "http://x");
  const enter = async (url = URL_A) => {
    await user.type(screen.getByLabelText("Paste your Steam profile URL"), url);
    await user.click(screen.getByRole("button", { name: /open the ledger/i }));
  };
  return { user, fetchMock, requested, enter };
}

beforeEach(() => localStorage.clear());

describe("App flow", () => {
  it("starts on the entry screen, with the Valve disclaimer", () => {
    setup();
    expect(screen.getByLabelText("Paste your Steam profile URL")).toBeInTheDocument();
    expect(screen.getByText(/Not affiliated with or endorsed by Valve/)).toBeInTheDocument();
  });

  it("shows a loading screen while the lookup runs, then the story", async () => {
    let finish!: (r: Response) => void;
    const { enter } = setup(new Promise<Response>((resolve) => (finish = resolve)));
    await enter();
    expect(await screen.findByText(/Looking up your ledger/)).toBeInTheDocument();
    expect(screen.queryByLabelText("Paste your Steam profile URL")).not.toBeInTheDocument();
    finish(ndjson({ type: "resolved", accountId: 1 }, storyEvent()));
    expect(await screen.findByText("Story ready: 120 matches")).toBeInTheDocument();
  });

  it("sends the pasted URL and the all-time window by default", async () => {
    const { enter, requested } = setup(ndjson(storyEvent()));
    await enter();
    await screen.findByText("Story ready: 120 matches");
    expect(requested().searchParams.get("q")).toBe(URL_A);
    expect(requested().searchParams.get("window")).toBe("all");
    expect(requested().searchParams.has("refresh")).toBe(false);
    expect(screen.getByText("All time")).toBeInTheDocument();
  });

  it("sends window=patch when This patch is chosen, and the story says which patch", async () => {
    const { enter, requested, user } = setup(
      ndjson(storyEvent({ window: "patch", patchStart: PATCH })),
    );
    await user.click(screen.getByRole("radio", { name: "This patch" }));
    await enter();
    expect(await screen.findByText("Since patch Sep 30, 2026")).toBeInTheDocument();
    expect(requested().searchParams.get("window")).toBe("patch");
  });

  it("labels the story All time when a patch window came back without a patch date (#25)", async () => {
    const { enter, user } = setup(ndjson(storyEvent({ window: "patch", patchStart: null })));
    await user.click(screen.getByRole("radio", { name: "This patch" }));
    await enter();
    await screen.findByText("Story ready: 120 matches");
    expect(screen.getByText(/^All time/)).toBeInTheDocument();
    expect(screen.queryByText(/this patch/i)).not.toBeInTheDocument();
  });

  it("remembers the URL and window, and restores them next visit", async () => {
    const { enter, user } = setup(ndjson(storyEvent({ window: "patch", patchStart: PATCH })));
    await user.click(screen.getByRole("radio", { name: "This patch" }));
    await enter();
    await screen.findByText(/Since patch/);
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
      expect(await screen.findByText("Story ready: 120 matches")).toBeInTheDocument();
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
    expect(await screen.findByText("Story ready: 120 matches")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(requested(1).searchParams.get("q")).toBe(URL_A);
    expect(requested(1).searchParams.get("window")).toBe("patch");
  });

  it("never mounts the story when there are zero matches", async () => {
    const empty = fixtureStory({ matchCount: 0, main: null, mvp: null });
    const { enter } = setup(ndjson(storyEvent({}, empty)));
    await enter();
    expect(await screen.findByRole("heading", { name: "No Deadlock matches found" })).toBeVisible();
    expect(screen.queryByText(/Story ready/)).not.toBeInTheDocument();
  });

  it("treats a Street Brawl-only player as zero matches", async () => {
    const brawl = fixtureStory({ matchCount: 0, excludedMatches: 14, main: null, mvp: null });
    const { enter } = setup(ndjson(storyEvent({}, brawl)));
    await enter();
    expect(await screen.findByText(/14 games/)).toBeInTheDocument();
    expect(screen.queryByText(/Story ready/)).not.toBeInTheDocument();
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
    expect(await screen.findByRole("status")).toHaveTextContent(/showing cached matches/i);
  });

  it("shows no cached-matches note for a fresh story", async () => {
    const { enter } = setup(ndjson(storyEvent()));
    await enter();
    await screen.findByText("Story ready: 120 matches");
    expect(screen.queryByText(/cached matches/i)).not.toBeInTheDocument();
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
    expect(await screen.findByText("Story ready: 120 matches")).toBeInTheDocument();
  });

  it("Look up another player returns to the entry screen", async () => {
    const { enter, user } = setup(ndjson(storyEvent()));
    await enter();
    await user.click(await screen.findByRole("button", { name: "Look up another player" }));
    expect(screen.getByLabelText("Paste your Steam profile URL")).toHaveValue(URL_A);
    expect(screen.queryByText(/Story ready/)).not.toBeInTheDocument();
  });
});
