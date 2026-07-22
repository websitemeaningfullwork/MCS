"use client";

import { useState } from "react";
import {
  MessageSquareText,
  FolderOpen,
  FileQuestion,
  StickyNote,
  FileText,
  FileArchive,
  Presentation,
  Link2,
  ExternalLink,
  Download,
  CircleCheck,
  CircleX,
  Sparkles,
  Star,
  type LucideIcon,
} from "lucide-react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Markdown } from "@/components/shared/markdown";
import { cn } from "@/lib/utils";
import { ReviewsTab } from "./reviews-tab";
import type { PublicReview } from "@/components/reviews/types";
import type {
  OwnReview,
  PlayerLesson,
  PlayerQuestion,
  PlayerResource,
  PlayerResourceType,
  PlayerTab,
} from "./types";

const RESOURCE_ICON: Record<PlayerResourceType, LucideIcon> = {
  pdf: FileText,
  docx: FileText,
  ppt: Presentation,
  zip: FileArchive,
  link: Link2,
  drive: ExternalLink,
  other: FileText,
};

export function LessonTabs({
  lesson,
  tab,
  onTabChange,
  reviews,
}: {
  lesson: PlayerLesson;
  tab: PlayerTab;
  onTabChange: (tab: PlayerTab) => void;
  reviews: {
    programId: string;
    currentModuleId: string;
    lessonComplete: boolean;
    seasonComplete: boolean;
    courseComplete: boolean;
    ownReviews: OwnReview[];
    onOwnReviewsChange: (next: OwnReview[]) => void;
    courseReviews: PublicReview[];
  };
}) {
  return (
    <Tabs
      value={tab}
      onValueChange={(v) => onTabChange(v as PlayerTab)}
      className="rounded-2xl border border-border bg-card p-4 shadow-card sm:p-6"
    >
      <TabsList variant="line" className="mb-5 flex-wrap gap-2">
        <TabsTrigger value="overview">
          <MessageSquareText className="text-primary" />
          Overview
        </TabsTrigger>
        <TabsTrigger value="resources">
          <FolderOpen className="text-success" />
          Resources
          {lesson.resources.length ? (
            <span className="ml-1 rounded-full bg-secondary px-1.5 text-xs text-muted-foreground">
              {lesson.resources.length}
            </span>
          ) : null}
        </TabsTrigger>
        <TabsTrigger value="qa">
          <FileQuestion className="text-[#8b5cf6]" />
          Q&amp;A
          {lesson.questions.length ? (
            <span className="ml-1 rounded-full bg-secondary px-1.5 text-xs text-muted-foreground">
              {lesson.questions.length}
            </span>
          ) : null}
        </TabsTrigger>
        <TabsTrigger value="notes">
          <StickyNote className="text-[#f59e0b]" />
          Notes
        </TabsTrigger>
        <TabsTrigger value="reviews">
          <Star className="text-amber-500" />
          Reviews
        </TabsTrigger>
      </TabsList>

      {/* Overview */}
      <TabsContent value="overview">
        <h3 className="mb-3 text-lg font-semibold text-foreground">About this lesson</h3>
        {lesson.overview_html ? (
          <div
            className="prose prose-slate max-w-none dark:prose-invert prose-headings:tracking-tight prose-a:text-primary"
            // Overview is authored by admins via the Chunk 3 editor (trusted source).
            dangerouslySetInnerHTML={{ __html: lesson.overview_html }}
          />
        ) : lesson.content_md ? (
          <Markdown content={lesson.content_md} />
        ) : (
          <EmptyState text="No overview has been added for this lesson yet." />
        )}
      </TabsContent>

      {/* Resources */}
      <TabsContent value="resources">
        <h3 className="mb-3 text-lg font-semibold text-foreground">Lesson resources</h3>
        {lesson.resources.length ? (
          <ul className="space-y-2">
            {lesson.resources.map((r) => (
              <ResourceRow key={r.id} resource={r} />
            ))}
          </ul>
        ) : (
          <EmptyState text="No resources for this lesson." />
        )}
      </TabsContent>

      {/* Q&A quiz */}
      <TabsContent value="qa">
        <h3 className="mb-1 text-lg font-semibold text-foreground">Class quiz</h3>
        <p className="mb-4 text-sm text-muted-foreground">
          Check your understanding after watching the lesson.
        </p>
        {lesson.questions.length ? (
          <QuizPlayer key={lesson.id} questions={lesson.questions} />
        ) : (
          <EmptyState text="No quiz for this lesson." />
        )}
      </TabsContent>

      {/* Notes */}
      <TabsContent value="notes">
        <h3 className="mb-3 text-lg font-semibold text-foreground">Notes for students</h3>
        {lesson.admin_notes?.trim() ? (
          <div className="whitespace-pre-wrap rounded-xl border border-border bg-secondary/30 p-4 text-sm text-foreground">
            {lesson.admin_notes}
          </div>
        ) : (
          <EmptyState text="No notes for this lesson." />
        )}
      </TabsContent>

      {/* Reviews */}
      <TabsContent value="reviews">
        <ReviewsTab
          programId={reviews.programId}
          currentLessonId={lesson.id}
          currentModuleId={reviews.currentModuleId}
          lessonComplete={reviews.lessonComplete}
          seasonComplete={reviews.seasonComplete}
          courseComplete={reviews.courseComplete}
          ownReviews={reviews.ownReviews}
          onOwnReviewsChange={reviews.onOwnReviewsChange}
          courseReviews={reviews.courseReviews}
        />
      </TabsContent>
    </Tabs>
  );
}

function ResourceRow({ resource }: { resource: PlayerResource }) {
  const url = resource.external_url || resource.file_url;
  const isFile = !!resource.file_url && !resource.external_url;
  const Icon = RESOURCE_ICON[resource.type] ?? FileText;
  return (
    <li className="flex items-center gap-3 rounded-xl border border-border p-3">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Icon className="size-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">{resource.title}</p>
        <p className="text-xs uppercase text-muted-foreground">{resource.type}</p>
      </div>
      {url ? (
        <Button variant="outline" size="sm" asChild>
          <a href={url} target="_blank" rel="noreferrer" download={isFile || undefined}>
            {isFile ? <Download className="size-4" /> : <ExternalLink className="size-4" />}
            {isFile ? "Download" : "Open"}
          </a>
        </Button>
      ) : null}
    </li>
  );
}

function QuizPlayer({ questions }: { questions: PlayerQuestion[] }) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [checked, setChecked] = useState(false);

  const answerable = questions.filter((q) => q.correct_answer);
  const score = answerable.filter(
    (q) => (answers[q.id] ?? "").trim().toLowerCase() === (q.correct_answer ?? "").trim().toLowerCase(),
  ).length;

  return (
    <div className="space-y-4">
      {questions.map((q, i) => {
        const chosen = answers[q.id] ?? "";
        const correct = (q.correct_answer ?? "").trim();
        const isRight = checked && chosen.trim().toLowerCase() === correct.toLowerCase();
        const isWrong = checked && chosen !== "" && !isRight;
        const options = q.type === "true_false" ? ["True", "False"] : q.options;

        return (
          <div key={q.id} className="rounded-xl border border-border p-4">
            <p className="mb-3 text-sm font-medium text-foreground">
              Q{i + 1}. {q.question}
            </p>

            {q.type === "short" ? (
              <input
                type="text"
                value={chosen}
                disabled={checked}
                onChange={(e) => setAnswers((a) => ({ ...a, [q.id]: e.target.value }))}
                placeholder="Type your answer…"
                className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary/50"
              />
            ) : (
              <div className="space-y-2">
                {options.map((opt) => {
                  const selected = chosen === opt;
                  const showCorrect = checked && correct.toLowerCase() === opt.toLowerCase();
                  return (
                    <label
                      key={opt}
                      className={cn(
                        "flex cursor-pointer items-center gap-2.5 rounded-lg border px-3 py-2 text-sm transition-colors",
                        showCorrect
                          ? "border-success/50 bg-success/10 text-foreground"
                          : checked && selected
                            ? "border-destructive/50 bg-destructive/5"
                            : selected
                              ? "border-primary/50 bg-primary/5"
                              : "border-border hover:bg-secondary/50",
                      )}
                    >
                      <input
                        type="radio"
                        name={q.id}
                        value={opt}
                        checked={selected}
                        disabled={checked}
                        onChange={() => setAnswers((a) => ({ ...a, [q.id]: opt }))}
                        className="accent-primary"
                      />
                      <span className="flex-1">{opt}</span>
                      {showCorrect ? <CircleCheck className="size-4 text-success" /> : null}
                    </label>
                  );
                })}
              </div>
            )}

            {checked && q.correct_answer ? (
              <div
                className={cn(
                  "mt-3 flex items-start gap-2 rounded-lg px-3 py-2 text-sm",
                  isRight
                    ? "bg-success/10 text-success"
                    : isWrong
                      ? "bg-destructive/10 text-destructive"
                      : "bg-secondary text-muted-foreground",
                )}
              >
                {isRight ? (
                  <CircleCheck className="mt-0.5 size-4 shrink-0" />
                ) : (
                  <CircleX className="mt-0.5 size-4 shrink-0" />
                )}
                <span>
                  <span className="font-medium text-foreground">
                    {isRight ? "Correct!" : `Answer: ${q.correct_answer}`}
                  </span>
                  {q.explanation ? (
                    <span className="mt-0.5 block text-muted-foreground">{q.explanation}</span>
                  ) : null}
                </span>
              </div>
            ) : null}
          </div>
        );
      })}

      <div className="flex items-center gap-3">
        {checked ? (
          <>
            {answerable.length ? (
              <span className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground">
                <Sparkles className="size-4 text-primary" />
                You scored {score}/{answerable.length}
              </span>
            ) : null}
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setChecked(false);
                setAnswers({});
              }}
            >
              Try again
            </Button>
          </>
        ) : (
          <Button size="sm" onClick={() => setChecked(true)}>
            Check answers
          </Button>
        )}
      </div>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <p className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
      {text}
    </p>
  );
}
