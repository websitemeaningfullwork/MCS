"use client";

import { RouteError } from "@/components/shared/route-error";

export default function AdminError(props: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  return (
    <RouteError {...props} scope="admin" description="We couldn't load this admin page. Please try again." />
  );
}
