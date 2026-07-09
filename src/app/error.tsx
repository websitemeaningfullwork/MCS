"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log for server/observability; avoid leaking details to the user.
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex min-h-[50vh] max-w-md flex-col items-center justify-center px-4 text-center">
      <h1 className="text-2xl font-semibold text-foreground">Something went wrong</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        We hit an unexpected error. Please try again — if it keeps happening,
        contact support.
      </p>
      <Button onClick={reset} className="mt-6 rounded-full">
        Try again
      </Button>
    </div>
  );
}
