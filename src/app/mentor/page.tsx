import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, GraduationCap, MessageCircleQuestion } from "lucide-react";

import { requireMentor } from "@/lib/mentor-guard";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Mentor" };

export default async function MentorOverviewPage() {
  const { user, profile, supabase } = await requireMentor();

  const [programsRes, waitingRes] = await Promise.all([
    supabase
      .from("programs")
      .select("id", { count: "exact", head: true })
      .eq("mentor_id", user.id),
    supabase
      .from("questions")
      .select("id", { count: "exact", head: true })
      .eq("mentor_id", user.id)
      .eq("status", "waiting"),
  ]);

  const stats = [
    {
      label: "My programs",
      value: programsRes.count ?? 0,
      icon: GraduationCap,
      href: "/mentor/programs",
    },
    {
      label: "Questions waiting",
      value: waitingRes.count ?? 0,
      icon: MessageCircleQuestion,
      href: "/mentor/questions",
      highlight: (waitingRes.count ?? 0) > 0,
    },
  ];

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Welcome, {(profile.full_name ?? "Mentor").split(" ")[0]} 👋
        </h1>
        <p className="mt-1 text-muted-foreground">Your mentorship at a glance.</p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        {stats.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="rounded-2xl border border-border bg-card p-5 shadow-card transition-all hover:-translate-y-0.5 hover:border-primary/30"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{stat.label}</span>
              <stat.icon
                className={stat.highlight ? "size-4 text-warning" : "size-4 text-primary"}
              />
            </div>
            <p className="mt-2 text-3xl font-semibold text-foreground">
              {stat.value}
            </p>
          </Link>
        ))}
      </div>

      {(waitingRes.count ?? 0) > 0 ? (
        <div className="flex flex-col items-start justify-between gap-4 rounded-2xl border border-warning/30 bg-warning/10 p-6 sm:flex-row sm:items-center">
          <div>
            <p className="font-semibold text-foreground">
              {waitingRes.count} student question{waitingRes.count === 1 ? "" : "s"} waiting
            </p>
            <p className="text-sm text-muted-foreground">
              Reply to keep your students moving forward.
            </p>
          </div>
          <Button asChild className="rounded-full">
            <Link href="/mentor/questions">
              Answer questions
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
      ) : null}
    </div>
  );
}
