"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { reportError } from "@/lib/observability";

/**
 * Shared client error boundary UI for route segments.
 *
 * Recovery uses Next 16's `unstable_retry()`, NOT `reset()`. Per the Next 16
 * `error.js` docs, `reset()` only clears the error state and re-renders WITHOUT
 * re-fetching, so it cannot recover from a Server Component error — which is
 * precisely what these boundaries catch here, since every guarded segment
 * fetches from Supabase during render. With `reset()` the "Try again" button
 * was effectively a no-op for the one failure mode it exists to handle.
 * `unstable_retry()` re-fetches and re-renders inside a Transition.
 */
export function RouteError({
  error,
  unstable_retry,
  scope,
  title = "Something went wrong",
  description = "We hit an unexpected error. Please try again.",
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
  /** Segment name used in the error report, e.g. "dashboard". */
  scope?: string;
  title?: string;
  description?: string;
}) {
  useEffect(() => {
    reportError(error, {
      scope: `route-error:${scope ?? "segment"}`,
      digest: error.digest,
    });
  }, [error, scope]);

  return (
    <div className="mx-auto flex min-h-[40vh] max-w-md flex-col items-center justify-center px-4 text-center">
      <h1 className="text-xl font-semibold text-foreground">{title}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{description}</p>
      <Button onClick={() => unstable_retry()} className="mt-6 rounded-full">
        Try again
      </Button>
    </div>
  );
}
