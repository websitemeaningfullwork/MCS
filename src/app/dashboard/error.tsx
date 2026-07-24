"use client";

import { RouteError } from "@/components/shared/route-error";

export default function DashboardError(props: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  return (
    <RouteError
      {...props}
      scope="dashboard"
      description="We couldn't load your dashboard. Please try again."
    />
  );
}
