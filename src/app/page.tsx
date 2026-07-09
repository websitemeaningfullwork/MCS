import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <div className="mx-auto max-w-6xl px-4">
      <section className="flex flex-col items-center py-20 text-center sm:py-28">
        <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-sm text-muted-foreground shadow-card">
          <Sparkles className="size-4 text-primary" />
          Bangladesh&apos;s premium mentorship platform
        </span>

        <h1 className="mt-6 max-w-3xl text-4xl font-semibold tracking-tight text-foreground sm:text-6xl">
          Find the Right Mentor.
          <br />
          <span className="text-primary">Build a Meaningful Career.</span>
        </h1>

        <p className="mt-6 max-w-2xl text-lg text-muted-foreground">
          Learn directly from experienced mentors through structured mentorship
          programs, premium courses, live sessions, e-books, and practical
          career guidance.
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Button asChild size="lg" className="rounded-full">
            <Link href="/mentors">
              Find Your Mentor
              <ArrowRight className="size-4" />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="rounded-full">
            <Link href="/programs">Explore Programs</Link>
          </Button>
        </div>

        <p className="mt-16 text-sm text-muted-foreground">
          🚧 Full homepage lands in the next build step. The design system,
          glass navbar, theme &amp; language toggles are live — try them above.
        </p>
      </section>
    </div>
  );
}
