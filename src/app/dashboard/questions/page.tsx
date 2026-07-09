import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, Plus } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { QuestionStatusBadge } from "@/components/dashboard/question-status-badge";

export const metadata: Metadata = { title: "Ask a Mentor" };

export default async function QuestionsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: questions } = await supabase
    .from("questions")
    .select("id, title, status, created_at")
    .eq("student_id", user!.id)
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Ask a Mentor
        </h1>
        <Button asChild className="rounded-full">
          <Link href="/dashboard/questions/new">
            <Plus className="size-4" />
            New question
          </Link>
        </Button>
      </div>

      {!questions || questions.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card/50 p-10 text-center">
          <p className="font-semibold text-foreground">No questions yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Ask your mentor anything about your learning or career.
          </p>
          <Button asChild className="mt-4 rounded-full">
            <Link href="/dashboard/questions/new">Ask your first question</Link>
          </Button>
        </div>
      ) : (
        <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card shadow-card">
          {questions.map((q) => (
            <li key={q.id}>
              <Link
                href={`/dashboard/questions/${q.id}`}
                className="flex items-center justify-between gap-4 p-4 transition-colors hover:bg-secondary/50"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium text-foreground">
                    {q.title}
                  </p>
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
