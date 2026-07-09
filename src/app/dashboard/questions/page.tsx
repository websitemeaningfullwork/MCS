import type { Metadata } from "next";
import { MessageCircleQuestion } from "lucide-react";

export const metadata: Metadata = { title: "Ask a Mentor" };

export default function QuestionsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">
        Ask a Mentor
      </h1>
      <div className="rounded-2xl border border-dashed border-border bg-card/50 p-10 text-center">
        <MessageCircleQuestion className="mx-auto size-8 text-primary" />
        <p className="mt-3 font-semibold text-foreground">Coming very soon</p>
        <p className="mt-1 text-sm text-muted-foreground">
          You&apos;ll be able to ask your mentor questions and track answers
          right here.
        </p>
      </div>
    </div>
  );
}
