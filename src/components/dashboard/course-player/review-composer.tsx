"use client";

import { useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, Loader2, PartyPopper, Trophy } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { StarInput } from "@/components/reviews/star-input";
import { submitReview } from "@/features/reviews/actions";
import type { ReviewScope } from "@/features/reviews/schema";
import type { OwnReview } from "./types";
import { cn } from "@/lib/utils";

type Variant = "lesson" | "season" | "course";

const COPY: Record<
  Variant,
  { icon: typeof CheckCircle2; title: string; sub: string; prompt: string; placeholder: string; accent: string }
> = {
  lesson: {
    icon: CheckCircle2,
    title: "Great job!",
    sub: "You've completed this lesson.",
    prompt: "How was this lesson?",
    placeholder: "Write your review (optional)…",
    accent: "text-success",
  },
  season: {
    icon: Trophy,
    title: "Congratulations!",
    sub: "You've completed this season.",
    prompt: "How was this season?",
    placeholder: "Write your feedback about this season…",
    accent: "text-amber-500",
  },
  course: {
    icon: PartyPopper,
    title: "Congratulations! 🎉",
    sub: "You've completed the course.",
    prompt: "How was your overall experience?",
    placeholder: "Share your overall experience…",
    accent: "text-[#8b5cf6]",
  },
};

/**
 * A completion-unlocked review card (lesson / season / course). Matches the
 * three unlock cards in `admin panel course.jpg`. Submitting sends the review to
 * moderation (pending) — the copy makes that clear.
 */
export function ReviewComposer({
  variant,
  programId,
  lessonId,
  moduleId,
  existing,
  onSubmitted,
}: {
  variant: Variant;
  programId: string;
  lessonId?: string | null;
  moduleId?: string | null;
  existing?: OwnReview;
  onSubmitted?: (review: OwnReview) => void;
}) {
  const copy = COPY[variant];
  const Icon = copy.icon;
  const [rating, setRating] = useState(existing?.rating ?? 0);
  const [body, setBody] = useState(existing?.body ?? "");
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(Boolean(existing));

  const scope: ReviewScope = variant === "lesson" ? "lesson" : variant === "season" ? "season" : "course";

  async function submit() {
    if (rating < 1) {
      toast.error("Pick a star rating first.");
      return;
    }
    setSaving(true);
    const res = await submitReview({
      programId,
      scope,
      lessonId: variant === "lesson" ? lessonId : null,
      moduleId: variant === "season" ? moduleId : null,
      rating,
      body: body.trim() || null,
    });
    setSaving(false);
    if (res.error) {
      toast.error(res.error);
      return;
    }
    setDone(true);
    toast.success("Thanks! Your review is pending approval.");
    onSubmitted?.({
      id: res.data?.id ?? existing?.id ?? "",
      scope,
      lesson_id: variant === "lesson" ? (lessonId ?? null) : null,
      module_id: variant === "season" ? (moduleId ?? null) : null,
      rating,
      body: body.trim() || null,
      status: "pending",
    });
  }

  const isApproved = existing?.status === "approved";

  return (
    <div
      className={cn(
        "rounded-2xl border border-border p-5 text-center shadow-card",
        variant === "course"
          ? "bg-gradient-to-br from-[#8b5cf6]/10 via-card to-primary/5"
          : "bg-card",
      )}
    >
      <span
        className={cn(
          "mx-auto flex size-12 items-center justify-center rounded-full",
          variant === "lesson" ? "bg-success/15" : variant === "season" ? "bg-amber-400/15" : "bg-[#8b5cf6]/15",
        )}
      >
        <Icon className={cn("size-6", copy.accent)} />
      </span>
      <h4 className="mt-3 text-lg font-semibold text-foreground">{copy.title}</h4>
      <p className="text-sm text-muted-foreground">{copy.sub}</p>

      {done ? (
        <div className="mt-4 flex flex-col items-center gap-2">
          <StarInput value={rating} onChange={() => {}} disabled />
          <p className="text-xs font-medium text-muted-foreground">
            {isApproved ? "Your review is published. Thank you!" : "Your review is pending approval."}
          </p>
          <Button variant="ghost" size="sm" onClick={() => setDone(false)}>
            Edit review
          </Button>
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          <p className="text-sm font-medium text-foreground">{copy.prompt}</p>
          <div className="flex justify-center">
            <StarInput value={rating} onChange={setRating} disabled={saving} />
          </div>
          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder={copy.placeholder}
            rows={3}
            disabled={saving}
            className="text-sm"
          />
          <Button onClick={submit} disabled={saving} className="w-full">
            {saving ? <Loader2 className="size-4 animate-spin" /> : null}
            Submit Review
          </Button>
        </div>
      )}
    </div>
  );
}
