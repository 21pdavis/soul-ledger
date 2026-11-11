import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ShareButton } from "@/components/story/ShareButton";
import type { StoryMeta } from "@/story/types";
import { fixtureStory } from "../fixtures/story";

const story = fixtureStory();
const live: StoryMeta = { window: "all", patchStart: null, stale: false, accountId: 42 };
const shared: StoryMeta = {
  ...live,
  shared: { at: "2026-11-11T09:30:00.000Z", playerName: "Gaben", slug: "gaben-abc" },
};

const jsonResponse = (body: unknown, status = 200, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", ...headers },
  });

const PNG = () => new Response(new Blob([new Uint8Array([1, 2, 3])], { type: "image/png" }));

let fetchMock: ReturnType<typeof vi.fn>;
const setNavigator = (props: Record<string, unknown>) => {
  for (const [k, v] of Object.entries(props)) {
    Object.defineProperty(navigator, k, { value: v, configurable: true });
  }
};

beforeEach(() => {
  fetchMock = vi.fn();
  vi.stubGlobal("fetch", fetchMock);
  setNavigator({ share: undefined, canShare: undefined, clipboard: undefined });
});
afterEach(() => vi.unstubAllGlobals());

const press = () => userEvent.click(screen.getByRole("button", { name: "Share" }));

describe("ShareButton on a desktop browser", () => {
  it("makes the link, then offers Download picture and Copy link", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ slug: "gaben-abc", path: "/w/gaben-abc" }));
    render(<ShareButton story={story} meta={live} index={3} />);
    await press();

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/share");
    expect(JSON.parse(init.body)).toEqual({ accountId: 42, window: "all" });
    const download = await screen.findByRole("link", { name: "Download picture" });
    expect(download).toHaveAttribute("href", "/w/gaben-abc/picture/3");
    expect(download).toHaveAttribute("download");
    expect(screen.getByRole("button", { name: "Copy link" })).toBeInTheDocument();
  });

  it("copies the full link and says so", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    setNavigator({ clipboard: { writeText } });
    fetchMock.mockResolvedValueOnce(jsonResponse({ slug: "gaben-abc", path: "/w/gaben-abc" }));
    render(<ShareButton story={story} meta={live} index={0} />);
    await press();
    await userEvent.click(await screen.findByRole("button", { name: "Copy link" }));
    expect(writeText).toHaveBeenCalledWith(`${window.location.origin}/w/gaben-abc`);
    expect(await screen.findByText("Link copied")).toBeInTheDocument();
  });

  it("reuses the current link on a shared page, with no request to make one", async () => {
    render(<ShareButton story={story} meta={shared} index={2} />);
    await press();
    expect(await screen.findByRole("link", { name: "Download picture" })).toHaveAttribute(
      "href",
      "/w/gaben-abc/picture/2",
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("closes the menu with Escape and gives focus back to Share", async () => {
    render(<ShareButton story={story} meta={shared} index={2} />);
    await press();
    await screen.findByRole("button", { name: "Copy link" });
    await userEvent.keyboard("{Escape}");
    expect(screen.queryByRole("button", { name: "Copy link" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Share" })).toHaveFocus();
  });
});

describe("ShareButton on a phone", () => {
  it("opens the share sheet with the slide's picture and the link", async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    setNavigator({ share, canShare: () => true });
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ slug: "gaben-abc", path: "/w/gaben-abc" }))
      .mockResolvedValueOnce(PNG());
    render(<ShareButton story={story} meta={live} index={1} />);
    await press();

    await waitFor(() => expect(share).toHaveBeenCalledOnce());
    expect(fetchMock.mock.calls[1][0]).toBe("/w/gaben-abc/picture/1");
    const data = share.mock.calls[0][0];
    expect(data.url).toBe(`${window.location.origin}/w/gaben-abc`);
    expect(data.files).toHaveLength(1);
    expect(data.files[0].type).toBe("image/png");
    expect(screen.queryByRole("button", { name: "Copy link" })).not.toBeInTheDocument();
  });

  it("stays quiet when the person closes the share sheet", async () => {
    const share = vi.fn().mockRejectedValue(new DOMException("cancelled", "AbortError"));
    setNavigator({ share, canShare: () => true });
    fetchMock.mockResolvedValueOnce(PNG());
    render(<ShareButton story={story} meta={shared} index={1} />);
    await press();
    await waitFor(() => expect(share).toHaveBeenCalled());
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});

describe("ShareButton when sharing fails", () => {
  it("says how long to wait after a 429, and never blocks", async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({ error: "rate_limited", retryAfter: 17 }, 429, { "retry-after": "17" }),
    );
    render(<ShareButton story={story} meta={live} index={0} />);
    await press();
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Too many shares, try again in 17 seconds",
    );
    expect(screen.getByRole("button", { name: "Share" })).toBeEnabled();
  });

  it("says so calmly on a server error or a dropped connection", async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ error: "unavailable" }, 503))
      .mockRejectedValueOnce(new TypeError("offline"));
    render(<ShareButton story={story} meta={live} index={0} />);
    await press();
    expect(await screen.findByRole("alert")).toHaveTextContent("Couldn't make a link");
    await press();
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    expect(await screen.findByRole("alert")).toHaveTextContent("Couldn't make a link");
  });

  it("says so when the story has no player to share", async () => {
    render(<ShareButton story={story} meta={{ ...live, accountId: undefined }} index={0} />);
    await press();
    expect(await screen.findByRole("alert")).toHaveTextContent("Couldn't make a link");
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
