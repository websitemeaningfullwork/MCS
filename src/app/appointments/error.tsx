"use client";

import { RouteError } from "@/components/shared/route-error";

export default function AppointmentsError(props: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <RouteError
      {...props}
      title="Booking error"
      description="We couldn't load your booking. Nothing has been charged — please try again."
    />
  );
}
