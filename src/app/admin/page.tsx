import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BadgeDollarSign, BookMarked, MessageCircleQuestion, Users } from "lucide-react";

import { requireAdmin } from "@/lib/admin-guard";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Admin" };

export default async function AdminOverviewPage() {
  const { supabase } = await requireAdmin();

  const [pendingRes, studentsRes, programsRes, questionsRes] = await Promise.all([
    supabase
      .from("manual_payment_submissions")
      .select("id", { count: "exact", head: true })
      .eq("status", "submitted"),
    supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("role", "student"),
    supabase.from("programs").select("id", { count: "exact", head: true }),
    supabase
      .from("questions")
      .select("id", { count: "exact", head: true })
      .neq("status", "closed"),
  ]);

  const kpis = [
    {
      label: "Pending payments",
      value: pendingRes.count ?? 0,
      icon: BadgeDollarSign,
      href: "/admin/payments",
      highlight: (pendingRes.count ?? 0) > 0,
    },
    { label: "Students", value: studentsRes.count ?? 0, icon: Users, href: "/admin/users" },
    { label: "Programs", value: programsRes.count ?? 0, icon: BookMarked, href: "/admin/programs" },
    {
      label: "Open questions",
      value: questionsRes.count ?? 0,
      icon: MessageCircleQuestion,
      href: "/admin/questions",
    },
  ];

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Admin overview
        </h1>
        <p className="mt-1 text-muted-foreground">
          Your control room for MCA.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <Link
            key={kpi.label}
            href={kpi.href}
            className="rounded-2xl border border-border bg-card p-5 shadow-card transition-all hover:-translate-y-0.5 hover:border-primary/30"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{kpi.label}</span>
              <kpi.icon
                className={kpi.highlight ? "size-4 text-warning" : "size-4 text-primary"}
              />
            </div>
            <p className="mt-2 text-3xl font-semibold text-foreground">
              {kpi.value}
            </p>
          </Link>
        ))}
      </div>

      {(pendingRes.count ?? 0) > 0 ? (
        <div className="flex flex-col items-start justify-between gap-4 rounded-2xl border border-warning/30 bg-warning/10 p-6 sm:flex-row sm:items-center">
          <div>
            <p className="font-semibold text-foreground">
              {pendingRes.count} payment{pendingRes.count === 1 ? "" : "s"} waiting for review
            </p>
            <p className="text-sm text-muted-foreground">
              Approve or reject to unlock (or explain) access for students.
            </p>
          </div>
          <Button asChild className="rounded-full">
            <Link href="/admin/payments">
              Review payments
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
      ) : null}
    </div>
  );
}
