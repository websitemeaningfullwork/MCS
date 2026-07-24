"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Loader2,
  MessageCircleQuestion,
  FolderOpen,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { setLessonCompletion } from "@/features/learning/actions";
import { YouTubeEmbed } from "@/components/shared/youtube-embed";
import { CurriculumSidebar } from "./curriculum-sidebar";
import { LessonTabs } from "./lesson-tabs";
import type { OwnReview, PlayerLesson, PlayerSeason, PlayerTab } from "./types";
import type { PublicReview } from "@/components/reviews/types";

type FlatLesson = { lesson: PlayerLesson; seasonIndex: number; lessonIndex: number; seasonTitle: string };

export function CoursePlayer({
  program,
  seasons,
  initialCompleted,
  initialLessonId,
  askMentorHref,
  isAdminPreview,
  initialOwnReviews,
  courseReviews,
}: {
  program: { id: string; title: string; slug: string };
  seasons: PlayerSeason[];
  initialCompleted: string[];
  initialLessonId: string | null;
  askMentorHref: string;
  isAdminPreview: boolean;
  initialOwnReviews: OwnReview[];
  courseReviews: PublicReview[];
}) {
  const flat = useMemo<FlatLesson[]>(() => {
    const out: FlatLesson[] = [];
    seasons.forEach((s, si) =>
      s.lessons.forEach((lesson, li) =>
        out.push({ lesson, seasonIndex: si, lessonIndex: li, seasonTitle: s.title }),
      ),
    );
    return out;
  }, [seasons]);

  const totalLessons = flat.length;

  const [completed, setCompleted] = useState<Set<string>>(new Set(initialCompleted));
  const [ownReviews, setOwnReviews] = useState<OwnReview[]>(initialOwnReviews);
  const [selectedId, setSelectedId] = useState<string | null>(
    initialLessonId && flat.some((f) => f.lesson.id === initialLessonId)
      ? initialLessonId
      : (flat[0]?.lesson.id ?? null),
  );
  const [tab, setTab] = useState<PlayerTab>("overview");
  const [saving, setSaving] = useState(false);

  const currentIdx = flat.findIndex((f) => f.lesson.id === selectedId);
  const current = currentIdx >= 0 ? flat[currentIdx] : null;
  const prev = currentIdx > 0 ? flat[currentIdx - 1] : null;
  const next = currentIdx >= 0 && currentIdx < flat.length - 1 ? flat[currentIdx + 1] : null;
  const isDone = current ? completed.has(current.lesson.id) : false;
  const currentSeason = current ? seasons[current.seasonIndex] : null;
  const lessonsInSeason = currentSeason ? currentSeason.lessons.length : 0;
  const seasonComplete = Boolean(
    currentSeason && lessonsInSeason > 0 && currentSeason.lessons.every((l) => completed.has(l.id)),
  );
  const courseComplete = totalLessons > 0 && flat.every((f) => completed.has(f.lesson.id));

  function selectLesson(id: string) {
    setSelectedId(id);
    setTab("overview");
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function toggleComplete() {
    if (!current) return;
    const target = !isDone;
    setSaving(true);
    // optimistic
    setCompleted((prev) => {
      const nextSet = new Set(prev);
      if (target) nextSet.add(current.lesson.id);
      else nextSet.delete(current.lesson.id);
      return nextSet;
    });
    const res = await setLessonCompletion(current.lesson.id, program.id, target);
    setSaving(false);
    if (res.error) {
      toast.error(res.error);
      // revert
      setCompleted((prev) => {
        const nextSet = new Set(prev);
        if (target) nextSet.delete(current.lesson.id);
        else nextSet.add(current.lesson.id);
        return nextSet;
      });
      return;
    }
    if (target) {
      toast.success("Lesson completed!");
      if (next) selectLesson(next.lesson.id);
    }
  }

  if (!current) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center shadow-card">
        <p className="font-semibold text-foreground">No lessons yet</p>
        <p className="mt-1 text-sm text-muted-foreground">
          This program&apos;s content is being prepared. Check back soon.
        </p>
        <Button asChild variant="outline" className="mt-4">
          <Link href="/dashboard/programs">Back to Dashboard</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[330px_minmax(0,1fr)]">
      {/* Curriculum */}
      <aside className="lg:sticky lg:top-24 lg:self-start lg:order-none">
        <CurriculumSidebar
          programTitle={program.title}
          seasons={seasons}
          currentLessonId={current.lesson.id}
          completed={completed}
          totalLessons={totalLessons}
          onSelect={selectLesson}
          onOpenResources={() => setTab("resources")}
        />
      </aside>

      {/* Main */}
      <div className="min-w-0 space-y-5">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                {current.lesson.title}
              </h1>
              <span
                className={cn(
                  "rounded-full px-2.5 py-0.5 text-xs font-medium",
                  isDone
                    ? "bg-success/15 text-success"
                    : "bg-primary/10 text-primary",
                )}
              >
                {isDone ? "Completed" : "In Progress"}
              </span>
              {isAdminPreview ? (
                <span className="rounded-full bg-warning/15 px-2.5 py-0.5 text-xs font-medium text-warning">
                  Admin preview
                </span>
              ) : null}
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Session {current.seasonIndex + 1}: {current.seasonTitle}
              <span className="mx-1.5">›</span>
              Lesson {current.lessonIndex + 1} of {lessonsInSeason}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href={askMentorHref}>
                <MessageCircleQuestion className="size-4" />
                Ask a Mentor
              </Link>
            </Button>
            <Button variant="outline" size="sm" onClick={() => setTab("resources")}>
              <FolderOpen className="size-4" />
              Resources
            </Button>
          </div>
        </div>

        {/* Video */}
        <YouTubeEmbed
          url={current.lesson.video_url}
          title={current.lesson.title}
          emptyLabel="No video for this lesson yet."
        />

        {/* Prev / mark / next */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card p-3 shadow-card">
          {prev ? (
            <button
              type="button"
              onClick={() => selectLesson(prev.lesson.id)}
              className="group flex min-w-0 items-center gap-2 text-left"
            >
              <ArrowLeft className="size-4 shrink-0 text-muted-foreground group-hover:text-foreground" />
              <span className="min-w-0">
                <span className="block text-xs text-muted-foreground">Previous Lesson</span>
                <span className="block truncate text-sm font-medium text-foreground">
                  {prev.lesson.title}
                </span>
              </span>
            </button>
          ) : (
            <span />
          )}

          <Button
            onClick={toggleComplete}
            disabled={saving}
            variant={isDone ? "outline" : "default"}
            className="shrink-0"
          >
            {saving ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Check className={cn("size-4", isDone && "text-success")} />
            )}
            {isDone ? "Completed" : "Mark as Complete"}
          </Button>

          {next ? (
            <button
              type="button"
              onClick={() => selectLesson(next.lesson.id)}
              className="group flex min-w-0 items-center justify-end gap-2 text-right"
            >
              <span className="min-w-0">
                <span className="block text-xs text-muted-foreground">Next Lesson</span>
                <span className="block truncate text-sm font-medium text-foreground">
                  {next.lesson.title}
                </span>
              </span>
              <ArrowRight className="size-4 shrink-0 text-muted-foreground group-hover:text-foreground" />
            </button>
          ) : (
            <span />
          )}
        </div>

        {/* Tabs */}
        <LessonTabs
          lesson={current.lesson}
          tab={tab}
          onTabChange={setTab}
          reviews={{
            programId: program.id,
            currentModuleId: currentSeason?.id ?? "",
            lessonComplete: isDone,
            seasonComplete,
            courseComplete,
            ownReviews,
            onOwnReviewsChange: setOwnReviews,
            courseReviews,
          }}
        />
      </div>
    </div>
  );
}
