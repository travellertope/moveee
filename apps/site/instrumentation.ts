/**
 * Server-side error reporting.
 *
 * Next.js redacts Server Component error messages before they reach the
 * browser in production — the client only ever sees the generic "An error
 * occurred in the Server Components render..." plus an opaque `digest`.
 * That made a homepage crash (a TypeError in MasonryRandomSection) take
 * days to pin down, because nothing anywhere printed the real message.
 *
 * `onRequestError` runs on the server with the UNREDACTED error, so this
 * prints a single greppable line per failure. To find one in Vercel:
 * Logs → search `MOVEEE_SERVER_ERROR`.
 *
 * Note the route still renders `app/error.tsx` for the visitor — this only
 * makes the cause visible to us. Keep the marker string stable; it's the
 * documented thing to search for.
 */
export async function onRequestError(
  error: unknown,
  request: { path?: string; method?: string; headers?: Record<string, string | undefined> },
  context: { routerKind?: string; routePath?: string; routeType?: string }
) {
  const err = error as (Error & { digest?: string }) | undefined;
  console.error(
    "MOVEEE_SERVER_ERROR",
    JSON.stringify({
      message: err?.message ?? String(error),
      digest: err?.digest ?? null,
      name: err?.name ?? null,
      path: request?.path ?? null,
      method: request?.method ?? null,
      routePath: context?.routePath ?? null,
      routeType: context?.routeType ?? null,
      country: request?.headers?.["x-vercel-ip-country"] ?? null,
      stack: err?.stack ?? null,
    })
  );
}

export async function register() {
  // Required export for the instrumentation file; no startup work needed.
}
