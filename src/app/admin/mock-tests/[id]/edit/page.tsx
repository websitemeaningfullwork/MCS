import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { requireAdmin } from "@/lib/admin-guard";
import { MockTestForm } from "@/components/admin/mock-test-form";
import { QuestionManager } from "@/components/admin/question-manager";

type TestType = "topic" | "practice" | "full";
type McqOption = { key: string; label: string };

export const metadata: Metadata = { title: "Edit mock test" };

export default async function EditMockTestPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { supabase } = await requireAdmin();

  const { data: test } = await supabase
    .from("mock_tests")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (!test) notFound();

  const [{ data: categories }, { data: questionRows }] = await Promise.all([
    supabase.from("categories").select("id, name").order("sort_order", { ascending: true }),
    supabase
      .from("mock_questions")
      .select("id, question, options, correct_key, sort_order")
      .eq("mock_test_id", id)
      .order("sort_order", { ascending: true }),
  ]);

  const questions = (questionRows ?? []).map((q) => ({
    id: q.id,
    question: q.question,
    options: (q.options as McqOption[]) ?? [],
    correct_key: q.correct_key,
  }));

  return (
    <div className="space-y-8">
      <Link
        href="/admin/mock-tests"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Back to mock tests
      </Link>
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">
        Edit mock test
      </h1>

      <MockTestForm
        categories={(categories ?? []).map((c) => ({ id: c.id, name: c.name }))}
        initial={{
          id: test.id,
          title: test.title,
          slug: test.slug,
          category_id: test.category_id,
          test_type: (test.test_type ?? "topic") as TestType,
          duration_minutes: test.duration_minutes ?? 10,
          is_free: test.is_free ?? true,
        }}
      />

      <div>
        <h2 className="mb-4 text-lg font-semibold text-foreground">Questions</h2>
        <QuestionManager testId={test.id} questions={questions} />
      </div>
    </div>
  );
}
