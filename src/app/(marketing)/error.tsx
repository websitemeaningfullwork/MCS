"use client";

import { RouteError } from "@/components/shared/route-error";

export default function MarketingError(props: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <RouteError
      {...props}
      description="We couldn't load this page. Please try again."
    />
  );
}
