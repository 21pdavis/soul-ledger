import { NextResponse, type NextFetchEvent, type NextRequest } from "next/server";
import { BYPASS_HEADER, gateDecision, readGateConfig, type GateConfig } from "@/lib/staging-gate";

/** Runs before every request; enforces the staging gate (ADR 0042). A no-op in production. */
export async function proxy(request: NextRequest, event: NextFetchEvent): Promise<Response> {
  const config = readGateConfig(process.env);

  if (!config.enabled) {
    // Production: no login, and Auth.js is never loaded.
    const decision = gateDecision({
      config,
      pathname: request.nextUrl.pathname,
      token: null,
      sessionEmail: null,
    });
    return decision === "not_found" ? new NextResponse(null, { status: 404 }) : NextResponse.next();
  }

  const { auth } = await import("@/auth");
  const gated = auth((req) => respond(config, req, req.auth?.user?.email ?? null));
  return (await gated(request, event as never)) ?? NextResponse.next();
}

function respond(config: GateConfig, request: NextRequest, sessionEmail: string | null): Response {
  const decision = gateDecision({
    config,
    pathname: request.nextUrl.pathname,
    token: request.headers.get(BYPASS_HEADER),
    sessionEmail,
  });

  let response: NextResponse;
  if (decision === "allow") {
    response = NextResponse.next();
  } else if (decision === "sign_in") {
    const signIn = new URL("/api/auth/signin", request.url);
    signIn.searchParams.set("callbackUrl", request.url);
    response = NextResponse.redirect(signIn);
  } else {
    response = NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  response.headers.set("x-robots-tag", "noindex, nofollow");
  return response;
}

export const config = {
  // Skip Next's static assets; everything else, API included, goes through the gate.
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
