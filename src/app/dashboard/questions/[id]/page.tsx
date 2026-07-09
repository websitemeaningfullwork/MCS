import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { QuestionStatusBadge } from "@/components/dashboard/question-status-badge";
import { AnswerForm } from "@/components/dashboard/answer-form";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Question" };

export default async function QuestionThreadPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: question } = await supabase
    .from("questions")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (!question) notFound();

  const { data: answers } = await supabase
    .from("answers")
    .select("id, body, author_id, created_at")
    .eq("question_id", id)
    .order("created_at", { ascending: true });

  const authorIds = [
    ...new Set((answers ?? []).map((a) => a.author_id).filter((x): x is string => Boolean(x))),
  ];
  const { data: authors } = authorIds.length
    ? await supabase.from("profiles").select("id, full_name, role").in("id", authorIds)
    : { data: [] };
  const authorById = new Map((authors ?? []).map((a) => [a.id, a]));

  return (
    <div className="space-y-6">
      <Link
        href="/dashboard/questions"
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

      {/* Original question */}
      <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
        <p className="text-xs font-medium text-muted-foreground">You asked</p>
        <p className="mt-2 whitespace-pre-line text-foreground">{question.body}</p>
      </div>

      {/* Answers */}
      <div className="space-y-3">
        {(answers ?? []).map((a) => {
          const author = a.author_id ? authorById.get(a.author_id) : null;
          const isStaff = author?.role === "admin" || author?.role === "mentor";
          const isMine = a.author_id === user!.id;
          return (
            <div
              key={a.id}
              className={cn(
                "rounded-2xl border p-5 shadow-card",
                isStaff
                  ? "border-primary/30 bg-primary/5"
                  : "border-border bg-card",
              )}
            >
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-foreground">
                  {isMine ? "You" : (author?.full_name ?? "MCA")}
                </span>
                {isStaff ? <Badge variant="secondary">Mentor</Badge> : null}
              </div>
              <p className="mt-2 whitespace-pre-line text-foreground">{a.body}</p>
            </div>
          );
        })}
      </div>

      {/* Follow-up */}
      {question.status !== "closed" ? (
        <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
          <h2 className="mb-3 text-sm font-medium text-foreground">
            Add a follow-up
          </h2>
          <AnswerForm questionId={question.id} placeholder="Add more details or a follow-up…" />
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          This question is closed.
        </p>
      )}
    </div>
  );
}
