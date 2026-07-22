"use client";

import { useMemo, useState } from "react";
import { Lock } from "lucide-react";

import { RatingSummary } from "@/components/reviews/rating-summary";
import { ReviewCard } from "@/components/reviews/review-card";
import { summarize, type PublicReview } from "@/components/reviews/types";
import { ReviewComposer } from "./review-composer";
import type { OwnReview } from "./types";

export function ReviewsTab({
  programId,
  currentLessonId,
  currentModuleId,
  lessonComplete,
  seasonComplete,
  courseComplete,
  ownReviews,
  onOwnReviewsChange,
  courseReviews,
}: {
  programId: string;
  currentLessonId: string;
  currentModuleId: string;
  lessonComplete: boolean;
  seasonComplete: boolean;
  courseComplete: boolean;
  ownReviews: OwnReview[];
  onOwnReviewsChange: (next: OwnReview[]) => void;
  courseReviews: PublicReview[];
}) {
  const [showAll, setShowAll] = useState(false);
  const summary = useMemo(() => summarize(courseReviews), [courseReviews]);

  const lessonReview = ownReviews.find((r) => r.scope === "lesson" && r.lesson_id === currentLessonId);
  const seasonReview = ownReviews.find((r) => r.scope === "season" && r.module_id === currentModuleId);
  const courseReview = ownReviews.find((r) => r.scope === "course");

  function upsertOwn(next: OwnReview) {
    const rest = ownReviews.filter(
      (r) =>
        !(
          r.scope === next.scope &&
          r.lesson_id === next.lesson_id &&
          r.module_id === next.module_id
        ),
    );
    onOwnReviewsChange([...rest, next]);
  }

  const anyUnlocked = lessonComplete || seasonComplete || courseComplete;
  const shownReviews = showAll ? courseReviews : courseReviews.slice(0, 4);

  return (
    <div className="space-y-6">
      {/* Completion-unlocked composers */}
      {anyUnlocked ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {lessonComplete ? (
            <ReviewComposer
              variant="lesson"
              programId={programId}
              lessonId={currentLessonId}
              existing={lessonReview}
              onSubmitted={upsertOwn}
            />
          ) : null}
          {seasonComplete ? (
            <ReviewComposer
              variant="season"
              programId={programId}
              moduleId={currentModuleId}
              existing={seasonReview}
              onSubmitted={upsertOwn}
            />
          ) : null}
          {courseComplete ? (
            <ReviewComposer
              variant="course"
              programId={programId}
              existing={courseReview}
              onSubmitted={upsertOwn}
            />
          ) : null}
        </div>
      ) : (
        <div className="flex items-center gap-3 rounded-2xl border border-dashed border-border bg-secondary/30 p-4 text-sm text-muted-foreground">
          <Lock className="size-4 shrink-0" />
          Complete this lesson to unlock reviews. Season and course reviews unlock
          as you progress.
        </div>
      )}

      {/* Public rating summary + approved reviews */}
      <div className="rounded-2xl border border-border bg-card p-5 shadow-card sm:p-6">
        <h3 className="mb-4 text-lg font-semibold text-foreground">Student reviews</h3>
        {summary.count > 0 ? (
          <>
            <RatingSummary summary={summary} />
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {shownReviews.map((r) => (
                <ReviewCard key={r.id} review={r} />
              ))}
            </div>
            {courseReviews.length > 4 ? (
              <button
                type="button"
                onClick={() => setShowAll((s) => !s)}
                className="mt-4 text-sm font-medium text-primary hover:underline"
              >
                {showAll ? "Show fewer reviews" : `Show all ${courseReviews.length} reviews`}
              </button>
            ) : null}
          </>
        ) : (
          <p className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
            No reviews yet — be the first to share your experience.
          </p>
        )}
      </div>
    </div>
  );
}
