"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, BookOpen, ChevronDown, CircleCheck, Circle, CirclePlay, FolderOpen } from "lucide-react";

import { cn } from "@/lib/utils";
import { formatDuration, type PlayerSeason } from "./types";

export function CurriculumSidebar({
  programTitle,
  seasons,
  currentLessonId,
  completed,
  totalLessons,
  onSelect,
  onOpenResources,
}: {
  programTitle: string;
  seasons: PlayerSeason[];
  currentLessonId: string | null;
  completed: Set<string>;
  totalLessons: number;
  onSelect: (lessonId: string) => void;
  onOpenResources: () => void;
}) {
  const currentSeasonId = seasons.find((s) =>
    s.lessons.some((l) => l.id === currentLessonId),
  )?.id;

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
      <div className="border-b border-border p-4">
        <Link
          href="/dashboard/programs"
          className="mb-3 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Back to Dashboard
        </Link>
        <div className="flex items-start gap-2.5">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <BookOpen className="size-5" />
          </span>
          <div className="min-w-0">
            <p className="line-clamp-2 text-sm font-semibold text-foreground">{programTitle}</p>
            <p className="text-xs text-muted-foreground">
              {totalLessons} {totalLessons === 1 ? "Lesson" : "Lessons"} ·{" "}
              {seasons.length} {seasons.length === 1 ? "Session" : "Sessions"}
            </p>
          </div>
        </div>
      </div>

      <div className="max-h-[62vh] overflow-y-auto">
        {seasons.map((season, si) => (
          <SeasonBlock
            key={season.id}
            season={season}
            index={si}
            currentLessonId={currentLessonId}
            completed={completed}
            defaultOpen={season.id === currentSeasonId}
            onSelect={onSelect}
          />
        ))}
      </div>

      <button
        type="button"
        onClick={onOpenResources}
        className="flex w-full items-center gap-3 border-t border-border p-4 text-left transition-colors hover:bg-secondary/50"
      >
        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <FolderOpen className="size-5" />
        </span>
        <span className="min-w-0">
          <span className="block text-sm font-medium text-foreground">Course Resources</span>
          <span className="block text-xs text-muted-foreground">Notes, PDFs, Practice Files</span>
        </span>
      </button>
    </div>
  );
}

function SeasonBlock({
  season,
  index,
  currentLessonId,
  completed,
  defaultOpen,
  onSelect,
}: {
  season: PlayerSeason;
  index: number;
  currentLessonId: string | null;
  completed: Set<string>;
  defaultOpen: boolean;
  onSelect: (lessonId: string) => void;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const doneCount = season.lessons.filter((l) => completed.has(l.id)).length;
  const pct = season.lessons.length
    ? Math.round((doneCount / season.lessons.length) * 100)
    : 0;

  return (
    <div className="border-b border-border last:border-0">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-2 px-4 py-3 text-left"
      >
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-foreground">
            Session {index + 1}: {season.title}
          </p>
          <p className="text-xs text-muted-foreground">
            {season.lessons.length} {season.lessons.length === 1 ? "Lesson" : "Lessons"}
          </p>
        </div>
        <span
          className={cn(
            "shrink-0 rounded-full px-2 py-0.5 text-xs font-medium",
            pct === 100
              ? "bg-success/15 text-success"
              : pct > 0
                ? "bg-success/10 text-success"
                : "bg-secondary text-muted-foreground",
          )}
        >
          {pct}%
        </span>
        <ChevronDown
          className={cn(
            "size-4 shrink-0 text-muted-foreground transition-transform",
            open && "rotate-180",
          )}
        />
      </button>

      {open ? (
        <ul className="pb-1">
          {season.lessons.map((lesson, li) => {
            const done = completed.has(lesson.id);
            const active = lesson.id === currentLessonId;
            const dur = formatDuration(lesson.duration_seconds);
            return (
              <li key={lesson.id}>
                <button
                  type="button"
                  onClick={() => onSelect(lesson.id)}
                  className={cn(
                    "flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm transition-colors",
                    active ? "bg-primary/10" : "hover:bg-secondary/50",
                  )}
                >
                  {done ? (
                    <CircleCheck className="size-5 shrink-0 text-success" />
                  ) : active ? (
                    <CirclePlay className="size-5 shrink-0 text-primary" />
                  ) : (
                    <Circle className="size-5 shrink-0 text-muted-foreground/40" />
                  )}
                  <span
                    className={cn(
                      "min-w-0 flex-1 truncate",
                      active ? "font-medium text-primary" : "text-foreground",
                    )}
                  >
                    {li + 1}. {lesson.title}
                  </span>
                  {dur ? (
                    <span className="shrink-0 text-xs text-muted-foreground">{dur}</span>
                  ) : null}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
