"use client";

import { RouteError } from "@/components/shared/route-error";

export default function DashboardError(props: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <RouteError
      {...props}
      description="We couldn't load your dashboard. Please try again."
    />
  );
}
