import { describe, expect, it } from "vitest";
import { lookupUrl, streamLookup, type ClientLookupEvent } from "@/lib/client/lookup-stream";

/** A fetch that answers with the given chunks, split exactly as written. */
function fetchOf(chunks: (string | Uint8Array)[], init: ResponseInit = { status: 200 }): typeof fetch {
  return async () => {
    const encoder = new TextEncoder();
    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        for (const chunk of chunks) {
          controller.enqueue(typeof chunk === "string" ? encoder.encode(chunk) : chunk);
        }
        controller.close();
      },
    });
    return new Response(body, init);
  };
}

async function collect(
  fetchImpl: typeof fetch,
  request = { input: "gaben", window: "all" as const, refresh: false },
): Promise<ClientLookupEvent[]> {
  const events: ClientLookupEvent[] = [];
  for await (const event of streamLookup(request, { fetch: fetchImpl })) events.push(event);
  return events;
}

const line = (event: unknown) => JSON.stringify(event) + "\n";

describe("lookupUrl", () => {
  it("sends the pasted input and the window, and only adds refresh=1 when refreshing", () => {
    const plain = new URL(
      lookupUrl({ input: "https://steamcommunity.com/id/gaben", window: "patch", refresh: false }),
      "http://x",
    );
    expect(plain.pathname).toBe("/api/lookup");
    expect(plain.searchParams.get("q")).toBe("https://steamcommunity.com/id/gaben");
    expect(plain.searchParams.get("window")).toBe("patch");
    expect(plain.searchParams.has("refresh")).toBe(false);

    const refreshed = new URL(lookupUrl({ input: "x", window: "all", refresh: true }), "http://x");
    expect(refreshed.searchParams.get("window")).toBe("all");
    expect(refreshed.searchParams.get("refresh")).toBe("1");
  });
});

describe("streamLookup", () => {
  it("yields each NDJSON line as an event, in order", async () => {
    const events = await collect(
      fetchOf([
        line({ type: "resolved", accountId: 7 }),
        line({ type: "history", totalMatches: 5, newMatches: 5, heroIds: [1, 2] }),
      ]),
    );
    expect(events[0]).toEqual({ type: "resolved", accountId: 7 });
    expect(events[1]).toMatchObject({ type: "history", heroIds: [1, 2] });
  });

  it("reassembles a line that is split across chunks, even mid-character", async () => {
    const full = line({ type: "profile", accountId: 7, personaName: "Zoë", avatarUrl: null });
    const bytes = new TextEncoder().encode(full);
    const cut = bytes.indexOf(0xc3) + 1; // between the two bytes of "ë"
    const end = line({ type: "error", reason: "not_found" });
    const events = await collect(fetchOf([bytes.slice(0, cut), bytes.slice(cut), end]));
    expect(events).toEqual([
      { type: "profile", accountId: 7, personaName: "Zoë", avatarUrl: null },
      { type: "error", reason: "not_found" },
    ]);
  });

  it("ignores blank lines and parses a last line with no trailing newline", async () => {
    const events = await collect(
      fetchOf([
        "\n",
        line({ type: "waiting" }),
        "\n\n",
        JSON.stringify({ type: "error", reason: "not_found" }),
      ]),
    );
    expect(events.map((e) => e.type)).toEqual(["waiting", "error"]);
  });

  it("passes the story event through with the story and patchStart as plain JSON", async () => {
    const events = await collect(
      fetchOf([
        line({
          type: "story",
          player: { accountId: 1, personaName: null, avatarUrl: null },
          window: "patch",
          patchStart: "2026-09-30T00:00:00.000Z",
          stale: true,
          story: { matchCount: 4 },
        }),
      ]),
    );
    const [event] = events;
    expect(event.type).toBe("story");
    if (event.type === "story") {
      expect(event.patchStart).toBe("2026-09-30T00:00:00.000Z");
      expect(event.stale).toBe(true);
      expect(event.story.matchCount).toBe(4);
    }
  });

  it("turns a network failure into a fetch_failed error event", async () => {
    const failing: typeof fetch = async () => {
      throw new TypeError("Failed to fetch");
    };
    expect(await collect(failing)).toEqual([{ type: "error", reason: "fetch_failed" }]);
  });

  it("reports a rejected query (HTTP 400) as invalid and other HTTP failures as fetch_failed", async () => {
    const bad = fetchOf(['{"error":"bad_request"}'], { status: 400 });
    expect(await collect(bad)).toEqual([{ type: "error", reason: "invalid" }]);
    const down = fetchOf(["oops"], { status: 502 });
    expect(await collect(down)).toEqual([{ type: "error", reason: "fetch_failed" }]);
  });

  it("ends with fetch_failed when the connection drops before a story or error arrives", async () => {
    const events = await collect(fetchOf([line({ type: "resolved", accountId: 7 })]));
    expect(events.map((e) => e.type)).toEqual(["resolved", "error"]);
    expect(events[1]).toEqual({ type: "error", reason: "fetch_failed" });
  });

  it("ends with fetch_failed when a line is not JSON", async () => {
    const events = await collect(fetchOf([line({ type: "resolved", accountId: 7 }), "<html>\n"]));
    expect(events.at(-1)).toEqual({ type: "error", reason: "fetch_failed" });
  });

  it("stops quietly when the caller aborts", async () => {
    const controller = new AbortController();
    const fetchImpl: typeof fetch = async () => {
      controller.abort();
      throw new DOMException("Aborted", "AbortError");
    };
    const events: ClientLookupEvent[] = [];
    for await (const e of streamLookup(
      { input: "x", window: "all", refresh: false },
      { fetch: fetchImpl, signal: controller.signal },
    )) {
      events.push(e);
    }
    expect(events).toEqual([]);
  });
});
