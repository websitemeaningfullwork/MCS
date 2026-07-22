import type { Metadata } from "next";
import Link from "next/link";

import { requireAdmin } from "@/lib/admin-guard";
import { EmptyState } from "@/components/marketing/empty-state";
import { ReviewsTable, type AdminReviewRow } from "@/components/admin/reviews-table";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Manage Reviews" };

const STATUS_FILTERS = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "hidden", label: "Hidden" },
  { value: "reported", label: "Reported" },
];

const RATING_FILTERS = ["all", "5", "4", "3", "2", "1"];

export default async function AdminReviewsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; rating?: string; program?: string }>;
}) {
  const { supabase } = await requireAdmin();
  const { status, rating, program } = await searchParams;
  const activeStatus = status ?? "all";
  const activeRating = rating ?? "all";
  const activeProgram = program ?? "all";

  // Program options for the filter.
  const { data: programOptions } = await supabase
    .from("programs")
    .select("id, title")
    .order("title", { ascending: true });

  let query = supabase
    .from("reviews")
    .select("id, user_id, program_id, scope, lesson_id, module_id, rating, body, status, created_at")
    .order("created_at", { ascending: false })
    .limit(500);
  if (activeStatus !== "all") query = query.eq("status", activeStatus);
  if (activeRating !== "all") query = query.eq("rating", Number(activeRating));
  if (activeProgram !== "all") query = query.eq("program_id", activeProgram);

  const { data: reviewRows } = await query;
  const list = reviewRows ?? [];

  // Resolve reviewer names, program titles, lesson/season titles.
  const userIds = [...new Set(list.map((r) => r.user_id))];
  const programIds = [...new Set(list.map((r) => r.program_id))];
  const lessonIds = [...new Set(list.map((r) => r.lesson_id).filter((x): x is string => !!x))];
  const moduleIds = [...new Set(list.map((r) => r.module_id).filter((x): x is string => !!x))];

  const [{ data: users }, { data: progs }, { data: lessons }, { data: modules }] =
    await Promise.all([
      userIds.length
        ? supabase.from("profiles").select("id, full_name, email").in("id", userIds)
        : Promise.resolve({ data: [] as { id: string; full_name: string | null; email: string }[] }),
      programIds.length
        ? supabase.from("programs").select("id, title").in("id", programIds)
        : Promise.resolve({ data: [] as { id: string; title: string }[] }),
      lessonIds.length
        ? supabase.from("lessons").select("id, title").in("id", lessonIds)
        : Promise.resolve({ data: [] as { id: string; title: string }[] }),
      moduleIds.length
        ? supabase.from("modules").select("id, title").in("id", moduleIds)
        : Promise.resolve({ data: [] as { id: string; title: string }[] }),
    ]);

  const userById = new Map((users ?? []).map((u) => [u.id, u]));
  const progById = new Map((progs ?? []).map((p) => [p.id, p.title]));
  const lessonById = new Map((lessons ?? []).map((l) => [l.id, l.title]));
  const moduleById = new Map((modules ?? []).map((m) => [m.id, m.title]));

  const rows: AdminReviewRow[] = list.map((r) => ({
    id: r.id,
    reviewerName: userById.get(r.user_id)?.full_name ?? "Unknown",
    reviewerEmail: userById.get(r.user_id)?.email ?? "",
    programTitle: progById.get(r.program_id) ?? "—",
    target:
      r.scope === "lesson"
        ? (lessonById.get(r.lesson_id ?? "") ?? "Lesson")
        : r.scope === "season"
          ? (moduleById.get(r.module_id ?? "") ?? "Season")
          : "Whole course",
    scope: r.scope,
    rating: r.rating,
    body: r.body ?? "",
    status: r.status,
    createdAt: r.created_at,
  }));

  function filterHref(next: { status?: string; rating?: string; program?: string }) {
    const params = new URLSearchParams();
    const s = next.status ?? activeStatus;
    const rt = next.rating ?? activeRating;
    const pg = next.program ?? activeProgram;
    if (s !== "all") params.set("status", s);
    if (rt !== "all") params.set("rating", rt);
    if (pg !== "all") params.set("program", pg);
    const q = params.toString();
    return `/admin/reviews${q ? `?${q}` : ""}`;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Manage Reviews
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Approve, hide, or remove student reviews. Only approved reviews appear
          publicly.
        </p>
      </div>

      {/* Filters */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium uppercase text-muted-foreground">Status</span>
          {STATUS_FILTERS.map((f) => (
            <Link
              key={f.value}
              href={filterHref({ status: f.value })}
              className={cn(
                "rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
                activeStatus === f.value
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-muted-foreground hover:text-foreground",
              )}
            >
              {f.label}
            </Link>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium uppercase text-muted-foreground">Rating</span>
          {RATING_FILTERS.map((r) => (
            <Link
              key={r}
              href={filterHref({ rating: r })}
              className={cn(
                "rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
                activeRating === r
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-muted-foreground hover:text-foreground",
              )}
            >
              {r === "all" ? "All" : `${r}★`}
            </Link>
          ))}
        </div>
        {programOptions && programOptions.length ? (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium uppercase text-muted-foreground">Program</span>
            <Link
              href={filterHref({ program: "all" })}
              className={cn(
                "rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
                activeProgram === "all"
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-muted-foreground hover:text-foreground",
              )}
            >
              All
            </Link>
            {programOptions.map((p) => (
              <Link
                key={p.id}
                href={filterHref({ program: p.id })}
                className={cn(
                  "max-w-[220px] truncate rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
                  activeProgram === p.id
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card text-muted-foreground hover:text-foreground",
                )}
              >
                {p.title}
              </Link>
            ))}
          </div>
        ) : null}
      </div>

      {rows.length === 0 ? (
        <EmptyState title="No reviews" description="Reviews matching these filters will appear here." />
      ) : (
        <ReviewsTable rows={rows} />
      )}
    </div>
  );
}
