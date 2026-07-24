"use client";

import { RouteError } from "@/components/shared/route-error";

export default function MarketingError(props: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  return (
    <RouteError
      {...props}
      scope="marketing"
      description="We couldn't load this page. Please try again."
    />
  );
}
