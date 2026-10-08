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
    const fetchMock = vi.fn(async () => stalling({ type: "resolved", accountId: 1 }));
    const user = userEvent.setup();
    render(<App fetchImpl={fetchMock as unknown as typeof fetch} pace={NO_PACE} />);
    await user.type(screen.getByLabelText("Paste your Steam profile URL"), URL_A);
    await user.click(screen.getByRole("button", { name: /open the ledger/i }));

    expect((await screen.findAllByText(/looking up your ledger/i)).length).toBeGreaterThan(0);
  });
});
