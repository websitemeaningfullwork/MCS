"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function markLessonComplete(
  lessonId: string,
  programId: string,
): Promise<{ error?: string }> {
  return setLessonCompletion(lessonId, programId, true);
}

/**
 * Set (or clear) a lesson's completion for the current student and roll the
 * enrollment progress % up. Enrollment + lesson-belongs-to-program are verified
 * server-side so a caller can't write progress for lessons they don't own.
 */
export async function setLessonCompletion(
  lessonId: string,
  programId: string,
  completed: boolean,
): Promise<{ error?: string; progress?: number }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Please log in to continue." };

  // Verify the user is enrolled in this program.
  const { data: enrollment } = await supabase
    .from("enrollments")
    .select("id")
    .eq("user_id", user.id)
    .eq("program_id", programId)
    .maybeSingle();
  if (!enrollment) return { error: "You are not enrolled in this program." };

  // Verify the lesson actually belongs to this program before writing progress
  // (otherwise a caller could mark arbitrary lessons complete).
  const { data: lessonRow } = await supabase
    .from("lessons")
    .select("id, module_id")
    .eq("id", lessonId)
    .maybeSingle();
  const { data: lessonModule } = lessonRow?.module_id
    ? await supabase
        .from("modules")
        .select("program_id")
        .eq("id", lessonRow.module_id)
        .maybeSingle()
    : { data: null };
  if (!lessonRow || lessonModule?.program_id !== programId) {
    return { error: "That lesson is not part of this program." };
  }

  // lesson_progress is user-writable under RLS.
  const { error: progressErr } = await supabase.from("lesson_progress").upsert(
    {
      user_id: user.id,
      lesson_id: lessonId,
      is_completed: completed,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,lesson_id" },
  );
  if (progressErr) {
    console.error("setLessonCompletion: lesson_progress upsert failed", progressErr);
    return { error: "Could not save your progress. Please try again." };
  }

  // Recompute program progress across the lessons a student can actually reach.
  //
  // The denominator MUST match what the course player shows. The player filters
  // `status = 'published'` for non-admins, so counting draft/hidden classes here
  // made 100% unreachable: a student finished everything visible and the bar
  // stuck at e.g. 80%, and completed_at was never written. It also disagreed with
  // isScopeComplete() in features/reviews/actions.ts (which does filter on
  // published), so the "leave a course review" CTA unlocked on a course the
  // dashboard still called incomplete. Same filter here => the two agree.
  const { data: modules } = await supabase
    .from("modules")
    .select("id")
    .eq("program_id", programId);
  const moduleIds = (modules ?? []).map((m) => m.id);

  const { data: lessons } = moduleIds.length
    ? await supabase
        .from("lessons")
        .select("id")
        .in("module_id", moduleIds)
        .eq("status", "published")
    : { data: [] };
  const lessonIds = (lessons ?? []).map((l) => l.id);
  // A program with zero published lessons reports 0%, not 100%. Nothing has been
  // learned yet — the content simply isn't live — so claiming completion would
  // stamp completed_at and hand out a "finished" course. This also matches
  // isScopeComplete(), which returns false when there are no published lessons.
  // The `|| 1` only guards the division; the numerator is 0 in that case anyway.
  const total = lessonIds.length || 1;

  const { count: completedCount } = lessonIds.length
    ? await supabase
        .from("lesson_progress")
        .select("lesson_id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("is_completed", true)
        .in("lesson_id", lessonIds)
    : { count: 0 };

  const progress = Math.round(((completedCount ?? 0) / total) * 100);

  // enrollments.progress is admin-write only under RLS — update via service role
  // (safe: server verified this user's enrollment above).
  const admin = createAdminClient();
  const { error: rollupErr } = await admin
    .from("enrollments")
    .update({
      progress,
      completed_at: progress >= 100 ? new Date().toISOString() : null,
    })
    .eq("user_id", user.id)
    .eq("program_id", programId);
  // The lesson is already saved; a failed rollup only means the % is stale and
  // will self-correct on the next completion. Log it, don't fail the action.
  if (rollupErr) {
    console.error("setLessonCompletion: enrollment progress rollup failed", rollupErr);
  }

  return { progress };
}
