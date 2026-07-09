import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, GraduationCap, Receipt, MessageCircleQuestion } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardOverviewPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [profileRes, enrollmentsRes, pendingOrdersRes, questionsRes] =
    await Promise.all([
      supabase.from("profiles").select("full_name").eq("id", user!.id).maybeSingle(),
      supabase
        .from("enrollments")
        .select("program_id, progress, created_at")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("orders")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user!.id)
        .eq("status", "pending_verification"),
      supabase
        .from("questions")
        .select("id", { count: "exact", head: true })
        .eq("student_id", user!.id)
        .neq("status", "closed"),
    ]);

  const fullName = profileRes.data?.full_name ?? "there";
  const enrollments = enrollmentsRes.data ?? [];
  const pendingOrders = pendingOrdersRes.count ?? 0;
  const openQuestions = questionsRes.count ?? 0;

  // Continue-learning: latest enrolled program.
  const latest = enrollments[0];
  let continueProgram: { title: string; slug: string; progress: number } | null =
    null;
  if (latest?.program_id) {
    const { data: program } = await supabase
      .from("programs")
      .select("title, slug")
      .eq("id", latest.program_id)
      .maybeSingle();
    if (program) {
      continueProgram = {
        title: program.title,
        slug: program.slug,
        progress: Number(latest.progress ?? 0),
      };
    }
  }

  const stats = [
    { label: "Enrolled programs", value: enrollments.length, icon: GraduationCap },
    { label: "Pending orders", value: pendingOrders, icon: Receipt },
    { label: "Open questions", value: openQuestions, icon: MessageCircleQuestion },
  ];

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Welcome back, {fullName.split(" ")[0]} 👋
        </h1>
        <p className="mt-1 text-muted-foreground">
          Here&apos;s a quick look at your learning.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl border border-border bg-card p-5 shadow-card"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{stat.label}</span>
              <stat.icon className="size-4 text-primary" />
            </div>
            <p className="mt-2 text-3xl font-semibold text-foreground">
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {continueProgram ? (
        <div className="rounded-2xl border border-border bg-gradient-to-br from-primary/10 via-card to-brand-hover/10 p-6 shadow-card">
          <p className="text-sm text-muted-foreground">Continue learning</p>
          <h2 className="mt-1 text-lg font-semibold text-foreground">
            {continueProgram.title}
          </h2>
          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-secondary">
            <div
              className="h-full rounded-full bg-primary"
              style={{ width: `${continueProgram.progress}%` }}
            />
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {Math.round(continueProgram.progress)}% complete
          </p>
          <Button asChild className="mt-4 rounded-full">
            <Link href={`/dashboard/learn/${continueProgram.slug}`}>
              Resume
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-border bg-card/50 p-8 text-center">
          <h2 className="font-semibold text-foreground">Start your journey</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            You haven&apos;t enrolled in a program yet.
          </p>
          <Button asChild className="mt-4 rounded-full">
            <Link href="/programs">Explore programs</Link>
          </Button>
        </div>
      )}
    </div>
  );
}
