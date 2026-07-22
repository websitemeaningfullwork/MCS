import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { EmptyState } from "@/components/marketing/empty-state";
import { MyReviews, type MyReviewRow } from "@/components/dashboard/my-reviews";

export const metadata: Metadata = { title: "My Reviews" };

export default async function MyReviewsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/dashboard/reviews");

  const { data: reviewRows } = await supabase
    .from("reviews")
    .select("id, program_id, scope, lesson_id, module_id, rating, body, status, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });
  const list = reviewRows ?? [];

  const programIds = [...new Set(list.map((r) => r.program_id))];
  const lessonIds = [...new Set(list.map((r) => r.lesson_id).filter((x): x is string => !!x))];
  const moduleIds = [...new Set(list.map((r) => r.module_id).filter((x): x is string => !!x))];

  const [{ data: progs }, { data: lessons }, { data: modules }] = await Promise.all([
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

  const progById = new Map((progs ?? []).map((p) => [p.id, p.title]));
  const lessonById = new Map((lessons ?? []).map((l) => [l.id, l.title]));
  const moduleById = new Map((modules ?? []).map((m) => [m.id, m.title]));

  const rows: MyReviewRow[] = list.map((r) => ({
    id: r.id,
    programTitle: progById.get(r.program_id) ?? "Program",
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">My Reviews</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Reviews you&apos;ve shared. Edited reviews return to pending until an admin
          re-approves them.
        </p>
      </div>

      {rows.length === 0 ? (
        <EmptyState
          title="No reviews yet"
          description="Complete a lesson, season, or course to leave your first review."
        />
      ) : (
        <MyReviews rows={rows} />
      )}
    </div>
  );
}
