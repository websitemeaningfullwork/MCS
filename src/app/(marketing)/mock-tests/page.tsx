import type { Metadata } from "next";
import Link from "next/link";
import { ClipboardList, Clock } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/marketing/empty-state";

export const metadata: Metadata = {
  title: "Mock Tests",
  description: "Practice with topic tests and full mocks, and track your scores.",
};

export default async function MockTestsPage() {
  const supabase = await createClient();
  const { data: tests } = await supabase
    .from("mock_tests")
    .select("id, slug, title, test_type, duration_minutes, is_free")
    .order("created_at", { ascending: false });

  return (
    <div className="mx-auto max-w-5xl px-4 py-14">
      <header className="max-w-2xl">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          Mock tests
        </h1>
        <p className="mt-3 text-muted-foreground">
          Sharpen your skills with practice tests and see instant, detailed
          results.
        </p>
      </header>

      {!tests || tests.length === 0 ? (
        <div className="mt-8">
          <EmptyState title="No tests yet" description="New mock tests are coming soon." />
        </div>
      ) : (
        <div className="mt-8 grid gap-5 sm:grid-cols-2">
          {tests.map((test) => (
            <Link
              key={test.id}
              href={`/mock-tests/${test.slug}`}
              className="group flex flex-col rounded-2xl border border-border bg-card p-6 shadow-card transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/30"
            >
              <div className="flex items-center justify-between">
                <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <ClipboardList className="size-5" />
                </span>
                {test.is_free ? <Badge variant="secondary">Free</Badge> : null}
              </div>
              <h2 className="mt-4 font-semibold text-foreground">{test.title}</h2>
              <div className="mt-2 flex items-center gap-3 text-xs capitalize text-muted-foreground">
                <span>{test.test_type}</span>
                {test.duration_minutes ? (
                  <span className="inline-flex items-center gap-1">
                    <Clock className="size-3.5" />
                    {test.duration_minutes} min
                  </span>
                ) : null}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
