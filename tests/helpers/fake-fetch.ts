type Handler = (url: URL) => Response | Promise<Response>;

export interface FakeFetch {
  fetch: typeof fetch;
  calls: URL[];
}

/**
 * A fetch stand-in that routes by "host + pathname" to handlers and records every call.
 * Unrouted requests fail the test loudly instead of reaching the network.
 */
export function fakeFetch(routes: Record<string, Handler>): FakeFetch {
  const calls: URL[] = [];
  const impl = async (input: RequestInfo | URL): Promise<Response> => {
    const url = new URL(input instanceof Request ? input.url : String(input));
    calls.push(url);
    const handler = routes[url.host + url.pathname];
    if (!handler) throw new Error(`Unexpected fetch: ${url.href}`);
    return handler(url);
  };
  return { fetch: impl as typeof fetch, calls };
}

export function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

export function text(body: string, status = 200): Response {
  return new Response(body, { status });
}
