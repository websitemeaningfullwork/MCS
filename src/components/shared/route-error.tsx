"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

/** Shared client error boundary UI for route segments. */
export function RouteError({
  error,
  reset,
  title = "Something went wrong",
  description = "We hit an unexpected error. Please try again.",
}: {
  error: Error & { digest?: string };
  reset: () => void;
  title?: string;
  description?: string;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex min-h-[40vh] max-w-md flex-col items-center justify-center px-4 text-center">
      <h1 className="text-xl font-semibold text-foreground">{title}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{description}</p>
      <Button onClick={reset} className="mt-6 rounded-full">
        Try again
      </Button>
    </div>
  );
}
