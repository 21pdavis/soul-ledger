import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { App } from "@/components/app/App";
import { NO_PACE } from "@/lib/client/loading-pace";
import { URL_A } from "./app-harness";

/** A response that sends the given lines and then goes quiet forever. */
function stalling(...events: unknown[]) {
  const encoder = new TextEncoder();
  return new Response(
    new ReadableStream({
      start(controller) {
        for (const e of events) controller.enqueue(encoder.encode(JSON.stringify(e) + "\n"));
      },
    }),
  );
}

beforeEach(() => localStorage.clear());

describe("App: a lookup that goes quiet", () => {
  it("shows a clear message with a retry option after the stall threshold", async () => {
    const fetchMock = vi.fn(async () => stalling({ type: "resolved", accountId: 1 }));
    const user = userEvent.setup();
    render(<App fetchImpl={fetchMock as unknown as typeof fetch} pace={NO_PACE} stallMs={80} />);
    await user.type(screen.getByLabelText("Paste your Steam profile URL"), URL_A);
    await user.click(screen.getByRole("button", { name: /open the ledger/i }));

    expect(screen.queryByText(/taking longer than usual/i)).not.toBeInTheDocument();
    expect(await screen.findByText(/taking longer than usual/i)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /try again/i }));
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("keeps showing a status note while loading, never an empty page", async () => {
    const fetchMock = vi.fn(async () =>
      stalling({ type: "resolved", accountId: 1 }, { type: "status", step: "contacting" }),
    );
    const user = userEvent.setup();
    render(<App fetchImpl={fetchMock as unknown as typeof fetch} pace={NO_PACE} />);
    await user.type(screen.getByLabelText("Paste your Steam profile URL"), URL_A);
    await user.click(screen.getByRole("button", { name: /open the ledger/i }));

    expect(await screen.findByText(/contacting deadlock's servers/i)).toBeInTheDocument();
  });

  it("does not show the stall message while status events keep arriving", async () => {
    const encoder = new TextEncoder();
    let controller!: ReadableStreamDefaultController;
    const body = new ReadableStream({
      start(c) {
        controller = c;
      },
    });
    const send = (e: unknown) => controller.enqueue(encoder.encode(JSON.stringify(e) + "\n"));
    const fetchMock = vi.fn(async () => new Response(body));
    const user = userEvent.setup();
    render(<App fetchImpl={fetchMock as unknown as typeof fetch} pace={NO_PACE} stallMs={150} />);
    await user.type(screen.getByLabelText("Paste your Steam profile URL"), URL_A);
    await user.click(screen.getByRole("button", { name: /open the ledger/i }));
    send({ type: "resolved", accountId: 1 });

    // 8 events, 50 ms apart: 400 ms in all, well past the 150 ms threshold.
    for (let i = 0; i < 8; i++) {
      send({ type: "status", step: "contacting" });
      await new Promise((r) => setTimeout(r, 50));
      expect(screen.queryByText(/taking longer than usual/i)).not.toBeInTheDocument();
    }
    // Then silence: the message does appear.
    expect(await screen.findByText(/taking longer than usual/i)).toBeInTheDocument();
  });
});
