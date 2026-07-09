import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Compass, HeartHandshake, Target } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "About",
  description:
    "Meaningful Career Academy is a premium, mentorship-first educational platform helping students build meaningful careers.",
};

const values = [
  {
    icon: HeartHandshake,
    title: "Mentorship first",
    body: "People grow fastest with a guide. Every part of MCA exists to strengthen the relationship between a student and their mentor.",
  },
  {
    icon: Target,
    title: "Trust before sales",
    body: "We're not here to push courses. We're here to help you make good decisions about your learning and your career.",
  },
  {
    icon: Compass,
    title: "Human-centered",
    body: "Clean, calm, and premium by design — so learning feels supportive, not overwhelming.",
  },
];

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:py-20">
      <header>
        <p className="text-sm font-medium text-primary">About MCA</p>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
          Guidance, not just courses.
        </h1>
        <p className="mt-6 text-lg text-muted-foreground">
          Meaningful Career Academy (MCA) is a premium, mentorship-first
          educational platform for Bangladesh. We believe students deserve more
          than video libraries — they deserve a mentor who guides them, answers
          their questions, and holds them accountable.
        </p>
      </header>

      <section className="mt-14 space-y-10">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">
            Our mission
          </h2>
          <p className="mt-3 text-muted-foreground">
            Help students build meaningful careers through personalized
            mentorship, structured learning, practical skills, and continuous
            support — all within one modern, fast, beautifully designed
            ecosystem.
          </p>
        </div>

        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">
            Our vision
          </h2>
          <p className="mt-3 text-muted-foreground">
            To build Bangladesh&apos;s most trusted mentorship ecosystem — where
            students don&apos;t just buy courses, they receive guidance,
            accountability, and clear career direction.
          </p>
        </div>
      </section>

      <section className="mt-14">
        <h2 className="text-2xl font-semibold tracking-tight text-foreground">
          What we value
        </h2>
        <div className="mt-6 space-y-4">
          {values.map((v) => (
            <div
              key={v.title}
              className="flex gap-4 rounded-2xl border border-border bg-card p-5 shadow-card"
            >
              <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <v.icon className="size-5" />
              </span>
              <div>
                <h3 className="font-semibold text-foreground">{v.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{v.body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-14 rounded-3xl border border-border bg-gradient-to-br from-primary/10 via-card to-brand-hover/10 p-8 text-center shadow-card">
        <h2 className="text-2xl font-semibold tracking-tight text-foreground">
          Ready to find your mentor?
        </h2>
        <p className="mx-auto mt-2 max-w-md text-muted-foreground">
          Browse our mentors and programs, and take the first step toward a
          meaningful career.
        </p>
        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <Button asChild size="lg" className="rounded-full">
            <Link href="/mentors">
              Meet the mentors
              <ArrowRight className="size-4" />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="rounded-full">
            <Link href="/programs">Browse programs</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
