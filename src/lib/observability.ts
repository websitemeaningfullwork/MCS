/**
 * Minimal error-reporting seam.
 *
 * The app previously did nothing but `console.error(error)` in its error
 * boundaries, which means production runtime failures — server-action throws,
 * RLS denials, client crashes — were effectively invisible.
 *
 * This module does NOT pull in a vendor SDK (that is a decision with cost and
 * data-residency implications, and it needs a DSN the deployer must supply).
 * What it does instead:
 *
 *   1. Emits a single structured JSON line to stderr. Vercel, Fly, Railway,
 *      CloudWatch and friends all ingest that and make it searchable/alertable
 *      with zero extra dependencies — a large step up from a bare stack trace.
 *   2. Gives the codebase ONE call site shape (`reportError`) so adopting
 *      Sentry/Bugsnag/OpenTelemetry later is a change to this file only, not a
 *      hunt through every boundary and catch block.
 *
 * To adopt a vendor later, initialise it here and forward inside `reportError`.
 */

export type ErrorContext = {
  /** Where it happened, e.g. "route-error:/dashboard" or "action:approvePayment". */
  scope?: string;
  /** Next.js error digest, when the boundary provides one. */
  digest?: string;
  /** Any additional non-sensitive breadcrumbs. */
  extra?: Record<string, unknown>;
};

/**
 * Report an unexpected error. Never throws — reporting must not become its own
 * failure mode inside an error boundary.
 *
 * Do NOT pass user-supplied secrets, tokens, or full request bodies in `extra`;
 * this output lands in logs that are broadly readable within a team.
 */
export function reportError(error: unknown, context: ErrorContext = {}): void {
  try {
    const err =
      error instanceof Error
        ? { name: error.name, message: error.message, stack: error.stack }
        : { name: "NonError", message: String(error) };

    const payload = {
      level: "error" as const,
      timestamp: new Date().toISOString(),
      scope: context.scope ?? "unknown",
      digest: context.digest,
      error: err,
      ...(context.extra ? { extra: context.extra } : {}),
    };

    // Single line so log aggregators parse it as one structured event.
    console.error(JSON.stringify(payload));
  } catch {
    // Last resort — never let the reporter mask the original failure.
    console.error("reportError failed", error);
  }
}
