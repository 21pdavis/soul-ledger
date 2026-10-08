import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { App } from "@/components/app/App";
import type { PaceConfig } from "@/lib/client/loading-pace";
import { URL_A, storyEvent } from "./app-harness";

// App with real pacing and fake timers: real events still gate every stage, the pacer only holds
// them back so each stage can be read (ADR 0056). Times below are for this config, not the
// shipped constants.
const PACE: PaceConfig = { stageDwellMs: 1000, tallyCountMs: 500, finalTailMs: 400 };

const profile = { type: "profile", accountId: 1, personaName: "Gaben", avatarUrl: null };
const history = { type: "history", totalMatches: 120, newMatches: 120, heroIds: [1, 2] };
const details = {
  type: "details",
  fetched: 100,
  total: 100,
  kills: 800,
  breakables: 300,
  sinnerJackpots: 0,
};
const done = { type: "done", matchCount: 120 };

const storyPlayer = () => screen.queryByRole("list", { name: "Story progress" });
const status = () => screen.getByRole("status").textContent;

function setReducedMotion(reduced: boolean) {
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches: reduced && query.includes("prefers-reduced-motion"),
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
  }));
}

/** Renders the App over a hand-fed lookup stream and starts a lookup. */
async function start() {
  const encoder = new TextEncoder();
  let controller!: ReadableStreamDefaultController<Uint8Array>;
  const body = new ReadableStream<Uint8Array>({ start: (c) => (controller = c) });
  const fetchMock = vi.fn(async () => new Response(body));
  render(<App fetchImpl={fetchMock as unknown as typeof fetch} pace={PACE} />);
  fireEvent.change(screen.getByLabelText("Paste your Steam profile URL"), {
    target: { value: URL_A },
  });
  fireEvent.click(screen.getByRole("button", { name: /open the ledger/i }));
  const push = async (...events: unknown[]) => {
    for (const e of events) controller.enqueue(encoder.encode(JSON.stringify(e) + "\n"));
    await elapse(0);
  };
  await elapse(0);
  return { push };
}

/** Lets the stream and the pacer's timers run for `ms`. */
const elapse = (ms: number) =>
  act(async () => {
    await vi.advanceTimersByTimeAsync(ms);
  });

beforeEach(() => {
  localStorage.clear();
  vi.useFakeTimers();
  setReducedMotion(false);
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("App loading pace", () => {
  it("shows events that arrive in one burst one stage at a time, then the story after the last stage's dwell and tail", async () => {
    const { push } = await start();
    await push({ type: "resolved", accountId: 1 }, profile, history, details, done, storyEvent());

    // Everything has arrived, but only the profile is on screen.
    expect(screen.getByText(/Found you, Gaben/)).toBeInTheDocument();
    expect(screen.queryByText("120 matches on the books")).not.toBeInTheDocument();
    expect(status()).toBe("Found Gaben.");

    await elapse(999);
    expect(screen.queryByText("120 matches on the books")).not.toBeInTheDocument();
    await elapse(1);
    expect(screen.getByText("120 matches on the books")).toBeInTheDocument();
    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
    expect(status()).toBe("120 matches on the books.");

    await elapse(1000);
    expect(screen.getByRole("progressbar")).toBeInTheDocument();
    expect(status()).toBe("Almost ready. Sealing the ledger."); // done came with the details stage
    expect(storyPlayer()).toBeNull();

    // The last stage has had 1000 of dwell at 3000; the tail runs to 3400.
    await elapse(1399);
    expect(storyPlayer()).toBeNull();
    expect(screen.getByRole("progressbar")).toBeInTheDocument();
    await elapse(1);
    expect(storyPlayer()).toBeInTheDocument();
    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
  });

  it("gives players with reduced motion the same time to read", async () => {
    setReducedMotion(true);
    const { push } = await start();
    await push(profile, history, storyEvent());
    expect(screen.queryByText("120 matches on the books")).not.toBeInTheDocument();
    await elapse(1000);
    expect(screen.getByText("120 matches on the books")).toBeInTheDocument();
    await elapse(1399);
    expect(storyPlayer()).toBeNull();
    await elapse(1);
    expect(storyPlayer()).toBeInTheDocument();
  });

  it("never advances a stage by itself: with no new event the loader waits however long it takes", async () => {
    const { push } = await start();
    await push(profile);
    await elapse(60_000);
    expect(screen.getByText(/Found you, Gaben/)).toBeInTheDocument();
    expect(screen.queryByText("120 matches on the books")).not.toBeInTheDocument();
    expect(storyPlayer()).toBeNull();
  });

  it("adds no delay when the real events are slower than the dwell", async () => {
    const { push } = await start();
    await push(profile);
    await elapse(5000);
    await push(history);
    expect(screen.getByText("120 matches on the books")).toBeInTheDocument();
    await elapse(5000);
    await push(details);
    expect(screen.getByRole("progressbar")).toBeInTheDocument();
    await elapse(5000);
    await push(done, storyEvent());
    expect(storyPlayer()).toBeInTheDocument();
  });

  it("shows an error at once, without waiting out a stage's dwell", async () => {
    const { push } = await start();
    await push(profile, history, { type: "error", reason: "unavailable" });
    expect(screen.getByRole("button", { name: "Try again" })).toBeInTheDocument();
    expect(screen.queryByText(/Found you/)).not.toBeInTheDocument();
  });

  it("shows a waiting note at once, mid-dwell", async () => {
    const { push } = await start();
    await push(profile, history, { type: "waiting" });
    expect(status()).toMatch(/waiting our turn/i);
  });
});
