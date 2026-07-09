import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-4 py-32 text-center">
      <p className="text-6xl font-semibold text-primary">404</p>
      <h1 className="mt-4 text-2xl font-semibold tracking-tight text-foreground">
        Page not found
      </h1>
      <p className="mt-2 text-muted-foreground">
        The page you&apos;re looking for doesn&apos;t exist or has moved.
      </p>
      <div className="mt-8 flex gap-3">
        <Button asChild className="rounded-full">
          <Link href="/">Go home</Link>
        </Button>
        <Button asChild variant="outline" className="rounded-full">
          <Link href="/programs">Browse programs</Link>
        </Button>
      </div>
    </div>
  );
}
