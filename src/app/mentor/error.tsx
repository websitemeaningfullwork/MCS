"use client";

import { RouteError } from "@/components/shared/route-error";

export default function MentorError(props: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  return (
    <RouteError
      {...props}
      scope="mentor"
      description="We couldn't load this mentor page. Please try again."
    />
  );
}
