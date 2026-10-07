/** Render's health check. Deliberately avoids the database so a Neon cold start can't fail it. */
export function GET() {
  return Response.json({ ok: true }, { headers: { "cache-control": "no-store" } });
}
