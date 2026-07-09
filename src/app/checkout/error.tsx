"use client";

import { RouteError } from "@/components/shared/route-error";

export default function CheckoutError(props: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <RouteError
      {...props}
      title="Checkout error"
      description="We couldn't complete this step. Your payment was not submitted — please try again."
    />
  );
}
