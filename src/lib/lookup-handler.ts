import { z } from "zod";
import { runLookup, type LookupDeps, type LookupEvent } from "./lookup";

const query = z.object({
  q: z.string().trim().min(1).max(200),
  window: z.enum(["all", "patch"]).default("all"),
  refresh: z
    .enum(["0", "1", "true", "false"])
    .default("0")
    .transform((v) => v === "1" || v === "true"),
});

/**
 * Builds the GET handler for /api/lookup. The response is NDJSON: one LookupEvent per line,
 * ending with a "story" or "error" event, so the client can render loading stages as they
 * arrive (ADR 0014, ADR 0026).
 */
export function createLookupHandler(deps: () => LookupDeps) {
  return async function GET(request: Request): Promise<Response> {
    const parsed = query.safeParse(Object.fromEntries(new URL(request.url).searchParams));
    if (!parsed.success) return Response.json({ error: "bad_request" }, { status: 400 });
    const { q, window, refresh } = parsed.data;

    const encoder = new TextEncoder();
    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        const emit = (event: LookupEvent) =>
          controller.enqueue(encoder.encode(JSON.stringify(event) + "\n"));
        try {
          await runLookup({ input: q, window, refresh }, deps(), emit);
        } catch (err) {
          console.error("lookup failed", err);
          emit({ type: "error", reason: "unavailable" });
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "content-type": "application/x-ndjson; charset=utf-8",
        "cache-control": "no-store",
        // Stop proxies from buffering the stream, which would hide the loading stages.
        "x-accel-buffering": "no",
      },
    });
  };
}
