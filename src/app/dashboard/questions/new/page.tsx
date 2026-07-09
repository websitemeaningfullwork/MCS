import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { NewQuestionForm } from "@/components/dashboard/new-question-form";

export const metadata: Metadata = { title: "New question" };

export default async function NewQuestionPage({
  searchParams,
}: {
  searchParams: Promise<{ mentor?: string }>;
}) {
  const { mentor } = await searchParams;

  return (
    <div className="space-y-6">
      <Link
        href="/dashboard/questions"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Back to questions
      </Link>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Ask a mentor
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Be specific — you&apos;ll usually get an answer within 24–48 hours.
        </p>
      </div>
      <NewQuestionForm mentorId={mentor} />
    </div>
  );
}
