import type { Metadata } from "next";
import Link from "next/link";

import { requireAdmin } from "@/lib/admin-guard";
import { QuestionStatusBadge } from "@/components/dashboard/question-status-badge";
import { EmptyState } from "@/components/marketing/empty-state";
import { cn } from "@/lib/utils";
import type { Enums } from "@/types/database.types";

export const metadata: Metadata = { title: "Questions" };

const FILTERS = [
  { value: "all", label: "All" },
  { value: "waiting", label: "Waiting" },
  { value: "answered", label: "Answered" },
  { value: "closed", label: "Closed" },
];

export default async function AdminQuestionsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { supabase } = await requireAdmin();
  const { status } = await searchParams;
  const active = status ?? "all";

  let query = supabase
    .from("questions")
    .select("id, title, status, student_id, created_at")
    .order("created_at", { ascending: false })
    .limit(200);
  if (active !== "all") {
    query = query.eq("status", active as Enums<"question_status">);
  }
  const { data: questions } = await query;
  const list = questions ?? [];

  const studentIds = [
    ...new Set(list.map((q) => q.student_id).filter((x): x is string => Boolean(x))),
  ];
  const { data: students } = studentIds.length
    ? await supabase.from("profiles").select("id, full_name, email").in("id", studentIds)
    : { data: [] };
  const studentById = new Map((students ?? []).map((s) => [s.id, s]));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">
        Questions
      </h1>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <Link
            key={f.value}
            href={`/admin/questions?status=${f.value}`}
            className={cn(
              "rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
              active === f.value
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-muted-foreground hover:text-foreground",
            )}
          >
            {f.label}
          </Link>
        ))}
      </div>

      {list.length === 0 ? (
        <EmptyState title="No questions" description="Student questions will appear here." />
      ) : (
        <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card shadow-card">
          {list.map((q) => {
            const student = q.student_id ? studentById.get(q.student_id) : null;
            return (
              <li key={q.id}>
                <Link
                  href={`/admin/questions/${q.id}`}
                  className="flex items-center justify-between gap-4 p-4 transition-colors hover:bg-secondary/50"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium text-foreground">
                      {q.title}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {student?.full_name ?? "Unknown"} · {student?.email ?? ""}
                    </p>
                  </div>
                  <QuestionStatusBadge status={q.status} />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
