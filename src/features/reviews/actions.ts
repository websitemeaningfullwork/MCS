"use server";

/**
 * Review-system server actions (Chunk 5).
 *
 * Students submit optional lesson / season / course reviews AFTER meaningful
 * completion (verified here server-side, not just in the UI). Reviews land as
 * `pending` and only surface publicly once an admin approves them. Admins
 * moderate (approve / hide / report / delete). Rating aggregates on programs and
 * mentors are recomputed through the service-role client so they pass the
 * mig-006 column guards.
 */

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { adminNotification, notify } from "@/features/notifications/service";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import {
  submitReviewSchema,
  updateReviewSchema,
  reviewStatuses,
  type ReviewStatus,
  type SubmitReviewInput,
} from "./schema";

type DB = SupabaseClient<Database>;
type Result<T = undefined> = { error?: string; data?: T };

async function getSession() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

async function isAdmin(supabase: DB, userId: string) {
  const { data } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();
  return data?.role === "admin";
}

/**
 * Has the student meaningfully completed the target of a review?
 *  - lesson: the class is marked complete
 *  - season: every published class in the module is complete
 *  - course: every published class in the program is complete
 */
async function isScopeComplete(
  supabase: DB,
  userId: string,
  args: { programId: string; scope: string; lessonId?: string | null; moduleId?: string | null },
): Promise<boolean> {
  if (args.scope === "lesson") {
    if (!args.lessonId) return false;
    const { data } = await supabase
      .from("lesson_progress")
      .select("is_completed")
      .eq("user_id", userId)
      .eq("lesson_id", args.lessonId)
      .maybeSingle();
    return Boolean(data?.is_completed);
  }

  // Determine the set of published lessons in scope.
  let moduleIds: string[];
  if (args.scope === "season") {
    if (!args.moduleId) return false;
    moduleIds = [args.moduleId];
  } else {
    const { data: mods } = await supabase
      .from("modules")
      .select("id")
      .eq("program_id", args.programId);
    moduleIds = (mods ?? []).map((m) => m.id);
  }
  if (!moduleIds.length) return false;

  const { data: lessons } = await supabase
    .from("lessons")
    .select("id")
    .in("module_id", moduleIds)
    .eq("status", "published");
  const lessonIds = (lessons ?? []).map((l) => l.id);
  if (!lessonIds.length) return false;

  const { count } = await supabase
    .from("lesson_progress")
    .select("lesson_id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("is_completed", true)
    .in("lesson_id", lessonIds);

  return (count ?? 0) >= lessonIds.length;
}

/**
 * Recompute programs.rating / reviews_count from APPROVED course reviews, then
 * roll the assigned mentors' aggregates across all their programs. Runs with the
 * service role (bypasses the mig-006 rating column guards).
 */
async function recomputeAggregates(programId: string) {
  const admin = createAdminClient();

  // --- program (from its approved COURSE reviews) --------------------------
  const { data: progReviews } = await admin
    .from("reviews")
    .select("rating")
    .eq("program_id", programId)
    .eq("scope", "course")
    .eq("status", "approved");
  const pr = progReviews ?? [];
  const progCount = pr.length;
  const progAvg = progCount
    ? Math.round((pr.reduce((s, r) => s + r.rating, 0) / progCount) * 100) / 100
    : 0;
  await admin
    .from("programs")
    .update({ rating: progAvg, reviews_count: progCount })
    .eq("id", programId);

  // --- mentors assigned to this program ------------------------------------
  const { data: pm } = await admin
    .from("program_mentors")
    .select("mentor_id")
    .eq("program_id", programId);
  const { data: legacy } = await admin
    .from("programs")
    .select("mentor_id")
    .eq("id", programId)
    .maybeSingle();
  const mentorIds = new Set<string>();
  for (const row of pm ?? []) if (row.mentor_id) mentorIds.add(row.mentor_id);
  if (legacy?.mentor_id) mentorIds.add(legacy.mentor_id);

  for (const mentorId of mentorIds) {
    // Every program this mentor is attached to (multi-assign + legacy).
    const { data: attached } = await admin
      .from("program_mentors")
      .select("program_id")
      .eq("mentor_id", mentorId);
    const { data: legacyPrograms } = await admin
      .from("programs")
      .select("id")
      .eq("mentor_id", mentorId);
    const programIds = new Set<string>();
    for (const row of attached ?? []) programIds.add(row.program_id);
    for (const row of legacyPrograms ?? []) programIds.add(row.id);
    if (!programIds.size) {
      await admin.from("mentors").update({ rating: 0, reviews_count: 0 }).eq("id", mentorId);
      continue;
    }

    const { data: mentorReviews } = await admin
      .from("reviews")
      .select("rating")
      .in("program_id", [...programIds])
      .eq("scope", "course")
      .eq("status", "approved");
    const mr = mentorReviews ?? [];
    const mCount = mr.length;
    const mAvg = mCount
      ? Math.round((mr.reduce((s, r) => s + r.rating, 0) / mCount) * 100) / 100
      : 0;
    await admin.from("mentors").update({ rating: mAvg, reviews_count: mCount }).eq("id", mentorId);
  }
}

// ============================================================
// Student actions
// ============================================================

export async function submitReview(input: SubmitReviewInput): Promise<Result<{ id: string }>> {
  const parsed = submitReviewSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check your review." };
  }
  const v = parsed.data;

  const { supabase, user } = await getSession();
  if (!user) return { error: "Please log in to leave a review." };

  // Enrollment gate (RLS also enforces this, fail early with a clear message).
  const { data: enrollment } = await supabase
    .from("enrollments")
    .select("id")
    .eq("user_id", user.id)
    .eq("program_id", v.programId)
    .maybeSingle();
  if (!enrollment) return { error: "You need to be enrolled to review this program." };

  const complete = await isScopeComplete(supabase, user.id, {
    programId: v.programId,
    scope: v.scope,
    lessonId: v.lessonId,
    moduleId: v.moduleId,
  });
  if (!complete) {
    return {
      error:
        v.scope === "lesson"
          ? "Complete this lesson before leaving a review."
          : v.scope === "season"
            ? "Finish every lesson in this season first."
            : "Finish the course before leaving a review.",
    };
  }

  const lessonId = v.scope === "lesson" ? (v.lessonId ?? null) : null;
  const moduleId = v.scope === "season" ? (v.moduleId ?? null) : null;
  const body = v.body?.trim() ? v.body.trim() : null;

  // Re-submitting for the same target edits the existing review. The reviews
  // uniqueness indexes are partial (per-scope), so ON CONFLICT can't infer them —
  // find-then-update/insert keeps this robust. The status guard trigger forces
  // any write back to 'pending' regardless.
  let existingQuery = supabase
    .from("reviews")
    .select("id")
    .eq("user_id", user.id)
    .eq("program_id", v.programId)
    .eq("scope", v.scope);
  existingQuery =
    v.scope === "lesson"
      ? existingQuery.eq("lesson_id", lessonId as string)
      : v.scope === "season"
        ? existingQuery.eq("module_id", moduleId as string)
        : existingQuery.is("lesson_id", null).is("module_id", null);
  const { data: existing } = await existingQuery.maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("reviews")
      .update({ rating: v.rating, body })
      .eq("id", existing.id);
    if (error) {
      console.error("submitReview: update failed", error);
      return { error: "Could not save your review. Please try again." };
    }
    await notify([
      adminNotification(
        "review_pending",
        "Review updated — needs re-approval",
        `A ${v.rating}-star ${v.scope} review was resubmitted and is awaiting moderation.`,
        { review_id: existing.id, href: "/admin/reviews" },
      ),
    ]);
    revalidatePath("/dashboard/reviews");
    return { data: { id: existing.id } };
  }

  const { data, error } = await supabase
    .from("reviews")
    .insert({
      user_id: user.id,
      program_id: v.programId,
      scope: v.scope,
      lesson_id: lessonId,
      module_id: moduleId,
      rating: v.rating,
      body,
      status: "pending",
    })
    .select("id")
    .maybeSingle();

  if (error || !data) {
    console.error("submitReview: insert failed", error);
    return { error: "Could not save your review. Please try again." };
  }

  // In-app notification (Chunk 9): new reviews land in the moderation queue.
  await notify([
    adminNotification(
      "review_pending",
      "New review awaiting approval",
      `A ${v.rating}-star ${v.scope} review was submitted.`,
      { review_id: data.id, href: "/admin/reviews" },
    ),
  ]);

  revalidatePath("/dashboard/reviews");
  return { data: { id: data.id } };
}

export async function updateOwnReview(input: {
  reviewId: string;
  rating: number;
  body?: string | null;
}): Promise<Result> {
  const parsed = updateReviewSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check your review." };
  }
  const { reviewId, rating, body } = parsed.data;

  const { supabase, user } = await getSession();
  if (!user) return { error: "Please log in." };

  const { data: existing } = await supabase
    .from("reviews")
    .select("id, user_id, program_id, status")
    .eq("id", reviewId)
    .maybeSingle();
  if (!existing || existing.user_id !== user.id) return { error: "Review not found." };

  const wasApproved = existing.status === "approved";

  // Editing pushes the review back to pending (status guard trigger enforces it).
  const { error } = await supabase
    .from("reviews")
    .update({ rating, body: body?.trim() ? body.trim() : null })
    .eq("id", reviewId);
  if (error) {
    console.error("updateOwnReview: update failed", error);
    return { error: "Could not update your review." };
  }

  // If it had been public, it now leaves the approved set → refresh aggregates.
  if (wasApproved) await recomputeAggregates(existing.program_id);

  await notify([
    adminNotification(
      "review_pending",
      "Review updated — needs re-approval",
      `A ${rating}-star review was edited and is awaiting moderation.`,
      { review_id: reviewId, href: "/admin/reviews" },
    ),
  ]);

  revalidatePath("/dashboard/reviews");
  return {};
}

export async function deleteOwnReview(reviewId: string): Promise<Result> {
  const { supabase, user } = await getSession();
  if (!user) return { error: "Please log in." };

  const { data: existing } = await supabase
    .from("reviews")
    .select("id, user_id, program_id, status")
    .eq("id", reviewId)
    .maybeSingle();
  if (!existing || existing.user_id !== user.id) return { error: "Review not found." };

  const { error } = await supabase.from("reviews").delete().eq("id", reviewId);
  if (error) {
    console.error("deleteOwnReview: delete failed", error);
    return { error: "Could not delete your review." };
  }

  if (existing.status === "approved") await recomputeAggregates(existing.program_id);

  revalidatePath("/dashboard/reviews");
  return {};
}

// ============================================================
// Admin moderation actions
// ============================================================

export async function setReviewStatus(
  reviewId: string,
  status: ReviewStatus,
): Promise<Result> {
  if (!reviewStatuses.includes(status)) return { error: "Invalid status." };

  const { supabase, user } = await getSession();
  if (!user || !(await isAdmin(supabase, user.id))) return { error: "Not authorized." };

  const admin = createAdminClient();
  const { data: existing } = await admin
    .from("reviews")
    .select("id, program_id, user_id, status")
    .eq("id", reviewId)
    .maybeSingle();
  if (!existing) return { error: "Review not found." };

  const { error } = await admin.from("reviews").update({ status }).eq("id", reviewId);
  if (error) {
    console.error("setReviewStatus: update failed", error);
    return { error: "Could not update the review." };
  }

  await recomputeAggregates(existing.program_id);

  // Tell the author their review went live (Chunk 9 navbar bell).
  if (status === "approved" && existing.status !== "approved") {
    await notify([
      {
        user_id: existing.user_id,
        role: "student",
        type: "review_approved",
        title: "Your review is now live",
        body: "Thanks for sharing your experience — an admin approved your review.",
        payload: { review_id: reviewId, href: "/dashboard/reviews" },
      },
    ]);
  }

  revalidatePath("/admin/reviews");
  revalidatePath("/"); // homepage testimonials
  revalidatePath("/programs/[slug]", "page");
  return {};
}

export async function deleteReview(reviewId: string): Promise<Result> {
  const { supabase, user } = await getSession();
  if (!user || !(await isAdmin(supabase, user.id))) return { error: "Not authorized." };

  const admin = createAdminClient();
  const { data: existing } = await admin
    .from("reviews")
    .select("id, program_id")
    .eq("id", reviewId)
    .maybeSingle();
  if (!existing) return { error: "Review not found." };

  const { error } = await admin.from("reviews").delete().eq("id", reviewId);
  if (error) {
    console.error("deleteReview: delete failed", error);
    return { error: "Could not delete the review." };
  }

  await recomputeAggregates(existing.program_id);

  revalidatePath("/admin/reviews");
  revalidatePath("/");
  revalidatePath("/programs/[slug]", "page");
  return {};
}
