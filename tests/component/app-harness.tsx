import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, vi } from "vitest";
import { App } from "@/components/app/App";
import { fixtureStory } from "../fixtures/story";

// Shared by the App component tests: a mocked lookup stream, and an entry-screen driver.

export const URL_A = "https://steamcommunity.com/id/gaben";
export const PATCH = "2026-09-30T00:00:00.000Z";

export const ndjson = (...events: unknown[]) =>
  new Response(events.map((e) => JSON.stringify(e) + "\n").join(""), {
    headers: { "content-type": "application/x-ndjson" },
  });

export const storyEvent = (over: Record<string, unknown> = {}, story = fixtureStory()) => ({
  type: "story",
  player: { accountId: 1, personaName: "Gaben", avatarUrl: null },
  window: "all",
  patchStart: null,
  stale: false,
  story,
  ...over,
});

/** Renders App over a fetch that answers each lookup with the next response (or throws an Error). */
export function setup(...responses: (Response | Promise<Response> | Error)[]) {
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

/** The real story player is up: its segmented progress bar is on screen. */
export const storyUp = () => screen.findByRole("list", { name: "Story progress" });
export const storyGone = () =>
  expect(screen.queryByRole("list", { name: "Story progress" })).not.toBeInTheDocument();
