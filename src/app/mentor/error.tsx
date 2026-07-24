"use client";

import { RouteError } from "@/components/shared/route-error";

export default function MentorError(props: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <RouteError
      {...props}
      description="We couldn't load this mentor page. Please try again."
    />
  );
}
