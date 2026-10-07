import { NextResponse, type NextRequest } from "next/server";
import {
  ACCESS_HEADER,
  KEY_PARAM,
  SESSION_COOKIE,
  SESSION_DAYS,
  gateDecision,
  readGateConfig,
  signSession,
} from "@/lib/staging-gate";

const PRIVATE_PAGE = `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex">
<title>Private</title></head><body style="font-family:system-ui;padding:2rem 1rem;max-width:32rem;margin:auto">
<h1>This staging site is private.</h1><p>Open it with your access link.</p></body></html>`;

/** Runs before every request and enforces the staging gate (ADR 0043). A no-op in production. */
export async function proxy(request: NextRequest): Promise<Response> {
  const config = readGateConfig(process.env);
  if (!config.enabled) return NextResponse.next();

  const url = request.nextUrl;
  const decision = gateDecision({
    config,
    pathname: url.pathname,
    headerToken: request.headers.get(ACCESS_HEADER),
    queryKey: url.searchParams.get(KEY_PARAM),
    cookie: request.cookies.get(SESSION_COOKIE)?.value ?? null,
    now: Date.now(),
  });

  let response: NextResponse;
  if (decision === "allow") {
    response = NextResponse.next();
  } else if (decision === "login") {
    // Drop the key from the address bar, then remember this browser for SESSION_DAYS.
    const clean = url.clone();
    clean.searchParams.delete(KEY_PARAM);
    response = NextResponse.redirect(clean);
    const maxAge = SESSION_DAYS * 24 * 60 * 60;
    response.cookies.set(
      SESSION_COOKIE,
      signSession(config.accessKey!, Date.now() + maxAge * 1000),
      {
        httpOnly: true,
        secure: true,
        sameSite: "lax",
        path: "/",
        maxAge,
      },
    );
  } else if (decision === "deny_api") {
    response = NextResponse.json({ error: "unauthorized" }, { status: 401 });
  } else {
    response = new NextResponse(PRIVATE_PAGE, {
      status: 401,
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  }
  response.headers.set("x-robots-tag", "noindex, nofollow");
  return response;
}

export const config = {
  // Skip Next's static assets; everything else, API included, goes through the gate.
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
