"use client";

import { RouteError } from "@/components/shared/route-error";

export default function CheckoutError(props: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  return (
    <RouteError
      {...props}
      scope="checkout"
      title="Checkout error"
      description="We couldn't complete this step. Your payment was not submitted — please try again."
    />
  );
}
