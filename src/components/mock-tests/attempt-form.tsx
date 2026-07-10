"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Check, Clock, Loader2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  submitAttempt,
  type AttemptResult,
  type McqOption,
} from "@/features/mock-tests/actions";

type Question = { id: string; question: string; options: McqOption[] };

export function AttemptForm({
  testId,
  title,
  questions,
  durationMinutes,
}: {
  testId: string;
  title: string;
  questions: Question[];
  durationMinutes?: number | null;
}) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<AttemptResult | null>(null);
  const [secondsLeft, setSecondsLeft] = useState<number | null>(
    durationMinutes && durationMinutes > 0 ? durationMinutes * 60 : null,
  );

  // Refs so the timer's auto-submit reads the latest answers / guards without
  // re-creating the interval on every keystroke. Synced in an effect (never
  // written during render).
  const answersRef = useRef(answers);
  const submittedRef = useRef(false);
  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);

  const doSubmit = useCallback(
    async (force: boolean) => {
      if (submittedRef.current) return;
      if (!force && Object.keys(answersRef.current).length < questions.length) {
        toast.error("Please answer all questions before submitting.");
        return;
      }
      submittedRef.current = true;
      setSubmitting(true);
      const res = await submitAttempt(testId, answersRef.current);
      if ("error" in res) {
        toast.error(res.error);
        submittedRef.current = false;
        setSubmitting(false);
        return;
      }
      setResult(res);
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    [questions.length, testId],
  );

  // Countdown: ticks down and auto-submits (whatever is answered) at zero.
  useEffect(() => {
    if (secondsLeft === null) return;
    if (secondsLeft <= 0) {
      toast.info("Time's up — submitting your answers.");
      void doSubmit(true);
      return;
    }
    const t = setTimeout(() => setSecondsLeft((s) => (s === null ? s : s - 1)), 1000);
    return () => clearTimeout(t);
  }, [secondsLeft, doSubmit]);

  async function handleSubmit() {
    await doSubmit(false);
  }

  const mm = secondsLeft !== null ? Math.floor(secondsLeft / 60) : 0;
  const ss = secondsLeft !== null ? secondsLeft % 60 : 0;

  if (result) {
    const pct = Math.round((result.score / result.total) * 100);
    return (
      <div className="space-y-6">
        <div className="rounded-2xl border border-border bg-card p-8 text-center shadow-card">
          <p className="text-sm text-muted-foreground">Your score</p>
          <p className="mt-1 text-5xl font-semibold text-foreground">
            {result.score}
            <span className="text-2xl text-muted-foreground">/{result.total}</span>
          </p>
          <p className="mt-2 text-sm text-muted-foreground">{pct}% correct</p>
        </div>

        <div className="space-y-4">
          {result.results.map((r, i) => (
            <div
              key={r.id}
              className="rounded-2xl border border-border bg-card p-5 shadow-card"
            >
              <p className="font-medium text-foreground">
                {i + 1}. {r.question}
              </p>
              <ul className="mt-3 space-y-2">
                {r.options.map((opt) => {
                  const isCorrect = opt.key === r.correctKey;
                  const isSelected = opt.key === r.selected;
                  return (
                    <li
                      key={opt.key}
                      className={cn(
                        "flex items-center justify-between rounded-lg border px-3 py-2 text-sm",
                        isCorrect
                          ? "border-success/40 bg-success/10 text-foreground"
                          : isSelected
                            ? "border-destructive/40 bg-destructive/10 text-foreground"
                            : "border-border text-muted-foreground",
                      )}
                    >
                      {opt.label}
                      {isCorrect ? (
                        <Check className="size-4 text-success" />
                      ) : isSelected ? (
                        <X className="size-4 text-destructive" />
                      ) : null}
                    </li>
                  );
                })}
              </ul>
              {r.explanation ? (
                <p className="mt-3 text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">Why: </span>
                  {r.explanation}
                </p>
              ) : null}
            </div>
          ))}
        </div>

        <div className="flex justify-center">
          <Button asChild variant="outline" className="rounded-full">
            <Link href="/mock-tests">Back to tests</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            {title}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Answer all {questions.length} questions, then submit.
          </p>
        </div>
        {secondsLeft !== null ? (
          <div
            role="timer"
            aria-live="polite"
            className={cn(
              "flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium tabular-nums",
              secondsLeft <= 30
                ? "border-destructive/40 bg-destructive/10 text-destructive"
                : "border-border bg-card text-foreground",
            )}
          >
            <Clock className="size-4" />
            {mm}:{String(ss).padStart(2, "0")}
          </div>
        ) : null}
      </header>

      <div className="space-y-4">
        {questions.map((q, i) => (
          <div
            key={q.id}
            className="rounded-2xl border border-border bg-card p-5 shadow-card"
          >
            <p className="font-medium text-foreground">
              {i + 1}. {q.question}
            </p>
            <RadioGroup
              className="mt-4 gap-2"
              value={answers[q.id] ?? ""}
              onValueChange={(value) =>
                setAnswers((prev) => ({ ...prev, [q.id]: value }))
              }
            >
              {q.options.map((opt) => (
                <Label
                  key={opt.key}
                  htmlFor={`${q.id}-${opt.key}`}
                  className="flex cursor-pointer items-center gap-3 rounded-lg border border-border px-3 py-2.5 text-sm font-normal transition-colors hover:bg-secondary/50 has-[:checked]:border-primary has-[:checked]:bg-primary/5"
                >
                  <RadioGroupItem value={opt.key} id={`${q.id}-${opt.key}`} />
                  {opt.label}
                </Label>
              ))}
            </RadioGroup>
          </div>
        ))}
      </div>

      <Button onClick={handleSubmit} disabled={submitting} size="lg" className="w-full">
        {submitting ? <Loader2 className="size-4 animate-spin" /> : null}
        Submit test
      </Button>
    </div>
  );
}
