import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { App } from "@/components/app/App";
import { NO_PACE } from "@/lib/client/loading-pace";
import { ndjson, storyEvent, storyUp } from "./app-harness";

describe("App opened on an expired share link", () => {
  it("says the story has expired and makes no lookup until asked", async () => {
    const fetchMock = vi.fn(async (url: RequestInfo | URL) => {
      void url;
      return ndjson(storyEvent());
    });
    render(
      <App
        expiredAccountId={4242}
        fetchImpl={fetchMock as unknown as typeof fetch}
        pace={NO_PACE}
      />,
    );
    expect(screen.getByRole("heading", { name: "This story has expired" })).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("See their latest runs a live lookup for that account and plays the live story", async () => {
    const fetchMock = vi.fn(async (url: RequestInfo | URL) => {
      void url;
      return ndjson(storyEvent());
    });
    const user = userEvent.setup();
    render(
      <App
        expiredAccountId={4242}
        fetchImpl={fetchMock as unknown as typeof fetch}
        pace={NO_PACE}
      />,
    );
    await user.click(screen.getByRole("button", { name: "See their latest" }));
    await storyUp();
    expect(new URL(String(fetchMock.mock.calls[0][0]), "http://x").searchParams.get("q")).toBe(
      "4242",
    );
  });

  it("Look up your own goes to the entry screen", async () => {
    const user = userEvent.setup();
    render(<App expiredAccountId={4242} pace={NO_PACE} />);
    await user.click(screen.getByRole("button", { name: "Look up your own" }));
    expect(screen.getByLabelText("Paste your Steam profile URL")).toBeInTheDocument();
  });
});
