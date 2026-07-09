import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ClipboardList, Clock, ListChecks } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";

async function getTest(slug: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("mock_tests")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  return data;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const test = await getTest(slug);
  return { title: test?.title ?? "Mock test" };
}

export default async function MockTestDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();
  const test = await getTest(slug);
  if (!test) notFound();

  const { count } = await supabase
    .from("mock_questions")
    .select("id", { count: "exact", head: true })
    .eq("mock_test_id", test.id);

  const facts = [
    { icon: ListChecks, label: `${count ?? 0} questions` },
    test.duration_minutes
      ? { icon: Clock, label: `${test.duration_minutes} minutes` }
      : null,
    { icon: ClipboardList, label: `${test.test_type} test` },
  ].filter(Boolean) as { icon: typeof ListChecks; label: string }[];

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 text-center">
      <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <ClipboardList className="size-7" />
      </span>
      <h1 className="mt-5 text-3xl font-semibold tracking-tight text-foreground">
        {test.title}
      </h1>

      <div className="mt-6 flex flex-wrap justify-center gap-3">
        {facts.map((f) => (
          <span
            key={f.label}
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-sm text-muted-foreground"
          >
            <f.icon className="size-4 text-primary" />
            {f.label}
          </span>
        ))}
      </div>

      <p className="mx-auto mt-6 max-w-md text-muted-foreground">
        Answer all questions, then submit to see your score with correct answers
        and explanations.
      </p>

      <Button asChild size="lg" className="mt-8 rounded-full">
        <Link href={`/mock-tests/${test.slug}/attempt`}>Start test</Link>
      </Button>
    </div>
  );
}
