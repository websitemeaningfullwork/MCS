import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { requireMentor } from "@/lib/mentor-guard";
import { Badge } from "@/components/ui/badge";
import { QuestionStatusBadge } from "@/components/dashboard/question-status-badge";
import { AnswerForm } from "@/components/dashboard/answer-form";
import { CloseQuestionButton } from "@/components/admin/close-question-button";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Answer question" };

export default async function MentorQuestionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { user, supabase } = await requireMentor();

  const { data: question } = await supabase
    .from("questions")
    .select("*")
    .eq("id", id)
    .eq("mentor_id", user.id)
    .maybeSingle();
  if (!question) notFound();

  const { data: answers } = await supabase
    .from("answers")
    .select("id, body, author_id, created_at")
    .eq("question_id", id)
    .order("created_at", { ascending: true });

  return (
    <div className="space-y-6">
      <Link
        href="/mentor/questions"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Back to questions
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          {question.title}
        </h1>
        <QuestionStatusBadge status={question.status} />
      </div>

      <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
        <p className="text-xs font-medium text-muted-foreground">A student asked</p>
        <p className="mt-2 whitespace-pre-line text-foreground">{question.body}</p>
      </div>

      <div className="space-y-3">
        {(answers ?? []).map((a) => {
          const mine = a.author_id === user.id;
          return (
            <div
              key={a.id}
              className={cn(
                "rounded-2xl border p-5 shadow-card",
                mine ? "border-primary/30 bg-primary/5" : "border-border bg-card",
              )}
            >
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-foreground">
                  {mine ? "You" : "Student"}
                </span>
                {mine ? <Badge variant="secondary">Mentor</Badge> : null}
              </div>
              <p className="mt-2 whitespace-pre-line text-foreground">{a.body}</p>
            </div>
          );
        })}
      </div>

      <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
        <h2 className="mb-3 font-semibold text-foreground">Post an answer</h2>
        <AnswerForm questionId={question.id} placeholder="Write your answer to the student…" />
      </div>

      {question.status !== "closed" ? (
        <CloseQuestionButton questionId={question.id} />
      ) : null}
    </div>
  );
}
