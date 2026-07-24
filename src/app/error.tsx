"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { reportError } from "@/lib/observability";

// Next 16 passes `unstable_retry` to error boundaries. `reset()` only clears
// the error state without re-fetching, so it cannot recover from a Server
// Component failure — which is what this boundary almost always catches.
export default function Error({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    // Structured report for observability; the user still sees only a generic
    // message so we never leak internals into the UI.
    reportError(error, { scope: "route-error:root", digest: error.digest });
  }, [error]);

  return (
    <div className="mx-auto flex min-h-[50vh] max-w-md flex-col items-center justify-center px-4 text-center">
      <h1 className="text-2xl font-semibold text-foreground">Something went wrong</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        We hit an unexpected error. Please try again — if it keeps happening,
        contact support.
      </p>
      <Button onClick={() => unstable_retry()} className="mt-6 rounded-full">
        Try again
      </Button>
    </div>
  );
}
