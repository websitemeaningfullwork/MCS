import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { AttemptForm } from "@/components/mock-tests/attempt-form";
import type { McqOption } from "@/features/mock-tests/actions";

export const metadata: Metadata = { title: "Attempt test" };

export default async function AttemptPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: test } = await supabase
    .from("mock_tests")
    .select("id, slug, title, is_free")
    .eq("slug", slug)
    .maybeSingle();
  if (!test) notFound();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/mock-tests/${slug}/attempt`);

  // Only free tests are attemptable until a paid-test access model exists.
  if (!test.is_free) redirect(`/mock-tests/${slug}`);

  // correct_key is not exposed: the public view omits it entirely.
  const { data: questionsData } = await supabase
    .from("public_mock_questions")
    .select("id, question, options, sort_order")
    .eq("mock_test_id", test.id)
    .order("sort_order", { ascending: true });

  const questions = (questionsData ?? []).map((q) => ({
    id: q.id,
    question: q.question,
    options: (q.options as McqOption[]) ?? [],
  }));

  if (questions.length === 0) notFound();

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <AttemptForm testId={test.id} title={test.title} questions={questions} />
    </div>
  );
}
