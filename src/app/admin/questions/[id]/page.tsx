import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { requireAdmin } from "@/lib/admin-guard";
import { Badge } from "@/components/ui/badge";
import { QuestionStatusBadge } from "@/components/dashboard/question-status-badge";
import { AnswerForm } from "@/components/dashboard/answer-form";
import { CloseQuestionButton } from "@/components/admin/close-question-button";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Answer question" };

export default async function AdminQuestionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { supabase } = await requireAdmin();

  const { data: question } = await supabase
    .from("questions")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (!question) notFound();

  const [{ data: student }, { data: answers }] = await Promise.all([
    question.student_id
      ? supabase
          .from("profiles")
          .select("full_name, email")
          .eq("id", question.student_id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    supabase
      .from("answers")
      .select("id, body, author_id, created_at")
      .eq("question_id", id)
      .order("created_at", { ascending: true }),
  ]);

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
        href="/admin/questions"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Back to questions
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            {question.title}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            From {student?.full_name ?? "Unknown"} · {student?.email ?? ""}
          </p>
        </div>
        <QuestionStatusBadge status={question.status} />
      </div>

      <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
        <p className="whitespace-pre-line text-foreground">{question.body}</p>
      </div>

      <div className="space-y-3">
        {(answers ?? []).map((a) => {
          const author = a.author_id ? authorById.get(a.author_id) : null;
          const isStaff = author?.role === "admin" || author?.role === "mentor";
          return (
            <div
              key={a.id}
              className={cn(
                "rounded-2xl border p-5 shadow-card",
                isStaff ? "border-primary/30 bg-primary/5" : "border-border bg-card",
              )}
            >
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-foreground">
                  {author?.full_name ?? "User"}
                </span>
                {isStaff ? <Badge variant="secondary">Staff</Badge> : (
                  <Badge variant="outline">Student</Badge>
                )}
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
