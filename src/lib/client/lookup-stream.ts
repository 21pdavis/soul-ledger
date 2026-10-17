import type { LookupEvent } from "@/lib/lookup";
import { filtersToQuery, type LookupFilters } from "@/story/filters";
import type { Jsonify } from "@/story/types";

/**
 * A lookup event as the browser receives it: the same shape as the server's `LookupEvent`, with
 * Dates turned into ISO strings, so `story` is a `StoryData` and `patchStart` is `string | null`.
 * The stream always ends with exactly one `story` or `error` event, and nothing follows it.
 */
export type ClientLookupEvent =
  | Jsonify<LookupEvent>
  /** Made by the client from an HTTP 429 (ADR 0075); the server never streams it. */
  | { type: "error"; reason: "rate_limited"; retryAfter: number };

export type ClientStoryEvent = Extract<ClientLookupEvent, { type: "story" }>;
export type ClientErrorEvent = Extract<ClientLookupEvent, { type: "error" }>;
export type LookupErrorReason = ClientErrorEvent["reason"];

export interface ClientLookupRequest extends LookupFilters {
  /** What the player pasted. */
  input: string;
  /** The Refresh action: fetch even if the player was synced moments ago. */
  refresh: boolean;
}

export interface StreamOptions {
  fetch?: typeof fetch;
  signal?: AbortSignal;
}

/** The request URL for `GET /api/lookup`. */
export function lookupUrl({ input, refresh, ...filters }: ClientLookupRequest): string {
  const params = new URLSearchParams({ q: input, ...filtersToQuery(filters) });
  if (refresh) params.set("refresh", "1");
  return `/api/lookup?${params}`;
}

const KNOWN_REASONS: readonly string[] = [
  "invalid",
  "not_found",
  "unavailable",
  "fetch_failed",
] satisfies LookupErrorReason[];

const failed = (reason: Exclude<LookupErrorReason, "rate_limited">): ClientLookupEvent => ({
  type: "error",
  reason,
});

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
  if (response.status === 429) {
    const seconds = Number(response.headers.get("retry-after"));
    const retryAfter = Number.isFinite(seconds) && seconds > 0 ? Math.ceil(seconds) : 60;
    yield { type: "error", reason: "rate_limited", retryAfter };
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

  const parse = (text: string): ClientLookupEvent | null | "bad" => {
    if (!text.trim()) return null;
    try {
      const event: unknown = JSON.parse(text);
      if (!event || typeof event !== "object") return "bad";
      return event as ClientLookupEvent;
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
        if (event.type === "story") {
          yield event;
          return;
        }
        if (event.type === "error") {
          // A reason this client does not know (a newer server) still gets a screen.
          yield KNOWN_REASONS.includes(event.reason) ? event : failed("fetch_failed");
          return;
        }
        yield event;
      }
      if (done) break;
    }
  } catch {
    if (!signal?.aborted) yield failed("fetch_failed");
    return;
  } finally {
    void reader.cancel().catch(() => {});
  }
  // The connection ended without a story or an error.
  yield failed("fetch_failed");
}
