import type { LookupEvent, StoryWindow } from "@/lib/lookup";
import type { Jsonify } from "@/story/types";

/**
 * A lookup event as the browser receives it: the same shape as the server's `LookupEvent`, with
 * Dates turned into ISO strings, so `story` is a `StoryData` and `patchStart` is `string | null`.
 * The stream always ends with exactly one `story` or `error` event.
 */
export type ClientLookupEvent = Jsonify<LookupEvent>;

export type ClientStoryEvent = Extract<ClientLookupEvent, { type: "story" }>;
export type ClientErrorEvent = Extract<ClientLookupEvent, { type: "error" }>;
export type LookupErrorReason = ClientErrorEvent["reason"];

export interface ClientLookupRequest {
  /** What the player pasted. */
  input: string;
  window: StoryWindow;
  /** The Refresh action: fetch even if the player was synced moments ago. */
  refresh: boolean;
}

export interface StreamOptions {
  fetch?: typeof fetch;
  signal?: AbortSignal;
}

/** The request URL for `GET /api/lookup`. */
export function lookupUrl({ input, window, refresh }: ClientLookupRequest): string {
  const params = new URLSearchParams({ q: input, window });
  if (refresh) params.set("refresh", "1");
  return `/api/lookup?${params}`;
}

const failed = (reason: LookupErrorReason): ClientLookupEvent => ({ type: "error", reason });

/**
 * Runs a lookup and yields its NDJSON events as they arrive. Never throws: a network failure, a
 * bad HTTP status, an unreadable line or a dropped connection becomes a final error event
 * instead. When the caller aborts, it just stops.
 */
export async function* streamLookup(
  request: ClientLookupRequest,
  { fetch: fetchImpl = fetch, signal }: StreamOptions = {},
): AsyncGenerator<ClientLookupEvent> {
  let response: Response;
  try {
    response = await fetchImpl(lookupUrl(request), { signal });
  } catch {
    if (!signal?.aborted) yield failed("fetch_failed");
    return;
  }
  if (!response.ok || !response.body) {
    // 400 means the server rejected the query itself (for example it is far too long).
    yield failed(response.status === 400 ? "invalid" : "fetch_failed");
    return;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let finished = false;

  const parse = (text: string): ClientLookupEvent | null | "bad" => {
    if (!text.trim()) return null;
    try {
      return JSON.parse(text) as ClientLookupEvent;
    } catch {
      return "bad";
    }
  };

  try {
    while (true) {
      const { done, value } = await reader.read();
      buffer += decoder.decode(value, { stream: !done });
      const lines = buffer.split("\n");
      // Without a trailing newline the last piece is incomplete, unless the stream is over.
      buffer = done ? "" : lines.pop()!;
      for (const text of lines) {
        const event = parse(text);
        if (event === null) continue;
        if (event === "bad") {
          yield failed("fetch_failed");
          return;
        }
        yield event;
        if (event.type === "story" || event.type === "error") finished = true;
      }
      if (done) break;
    }
  } catch {
    if (!signal?.aborted) yield failed("fetch_failed");
    return;
  } finally {
    void reader.cancel().catch(() => {});
  }
  if (!finished) yield failed("fetch_failed");
}
