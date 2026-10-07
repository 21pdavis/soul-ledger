import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { Db } from "@/db";
import { createLookupHandler } from "@/lib/lookup-handler";
import { createTestDb } from "../helpers/db";
import { fakeApi } from "../helpers/fake-api";
import { TEST_ACCOUNT_ID } from "../helpers/fixtures";

let db: Db;
let close: () => Promise<void>;

beforeEach(async () => {
  ({ db, close } = await createTestDb());
});
afterEach(() => close());

function handler() {
  const { api, state } = fakeApi();
  return { GET: createLookupHandler(() => ({ db, api })), state };
}

async function readNdjson(res: Response): Promise<Record<string, unknown>[]> {
  const body = await res.text();
  return body
    .split("\n")
    .filter(Boolean)
    .map((line) => JSON.parse(line) as Record<string, unknown>);
}

describe("GET /api/lookup", () => {
  it("streams lookup progress then the story as NDJSON", async () => {
    const { GET } = handler();
    const res = await GET(new Request(`http://localhost/api/lookup?q=${TEST_ACCOUNT_ID}`));

    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("application/x-ndjson");
    expect(res.headers.get("cache-control")).toBe("no-store");

    const events = await readNdjson(res);
    expect(events[0]).toEqual({ type: "resolved", accountId: TEST_ACCOUNT_ID });
    const story = events.at(-1)!;
    expect(story).toMatchObject({ type: "story", window: "all", stale: false });
    expect((story.story as { matchCount: number }).matchCount).toBe(351);
    // Dates travel as ISO strings.
    expect((story.story as { intro: { lastMatchAt: string } }).intro.lastMatchAt).toBe(
      "2026-10-06T21:35:39.000Z",
    );
  });

  it("passes window and refresh through", async () => {
    const { GET, state } = handler();
    await readNdjson(await GET(new Request(`http://localhost/api/lookup?q=${TEST_ACCOUNT_ID}`)));
    const events = await readNdjson(
      await GET(
        new Request(`http://localhost/api/lookup?q=${TEST_ACCOUNT_ID}&window=patch&refresh=1`),
      ),
    );
    expect(events.at(-1)).toMatchObject({ type: "story", window: "patch" });
    expect(state.calls.history).toBe(2); // refresh skipped the 5-minute freshness check
  });

  it.each([
    ["missing q", "http://localhost/api/lookup"],
    ["empty q", "http://localhost/api/lookup?q="],
    ["bad window", `http://localhost/api/lookup?q=${TEST_ACCOUNT_ID}&window=year`],
    ["oversized q", `http://localhost/api/lookup?q=${"x".repeat(300)}`],
  ])("rejects a request with %s", async (_name, url) => {
    const { GET, state } = handler();
    const res = await GET(new Request(url));
    expect(res.status).toBe(400);
    expect(state.calls.history).toBe(0);
  });

  it("ends the stream with an error event if something unexpected breaks", async () => {
    const GET = createLookupHandler(() => {
      throw new Error("no database");
    });
    const events = await readNdjson(
      await GET(new Request(`http://localhost/api/lookup?q=${TEST_ACCOUNT_ID}`)),
    );
    expect(events).toEqual([{ type: "error", reason: "unavailable" }]);
  });
});
