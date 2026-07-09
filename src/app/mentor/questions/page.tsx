import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

import { requireMentor } from "@/lib/mentor-guard";
import { QuestionStatusBadge } from "@/components/dashboard/question-status-badge";
import { EmptyState } from "@/components/marketing/empty-state";

export const metadata: Metadata = { title: "Questions" };

export default async function MentorQuestionsPage() {
  const { user, supabase } = await requireMentor();

  const { data: questions } = await supabase
    .from("questions")
    .select("id, title, status, created_at")
    .eq("mentor_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">
        Questions for you
      </h1>

      {!questions || questions.length === 0 ? (
        <EmptyState
          title="No questions yet"
          description="Student questions directed to you will appear here."
        />
      ) : (
        <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card shadow-card">
          {questions.map((q) => (
            <li key={q.id}>
              <Link
                href={`/mentor/questions/${q.id}`}
                className="flex items-center justify-between gap-4 p-4 transition-colors hover:bg-secondary/50"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium text-foreground">{q.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {q.created_at
                      ? new Date(q.created_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })
                      : ""}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <QuestionStatusBadge status={q.status} />
                  <ChevronRight className="size-4 text-muted-foreground" />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
