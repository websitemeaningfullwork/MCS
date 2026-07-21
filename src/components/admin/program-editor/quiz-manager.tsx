"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Loader2, X, CheckCircle2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  createQuestion,
  updateQuestion,
  deleteQuestion,
} from "@/features/admin/program-editor-actions";
import {
  QUESTION_TYPE_LABELS,
  type Question,
  type QuestionType,
  type SaveFn,
} from "./types";

type Draft = {
  id: string | null;
  type: QuestionType;
  question: string;
  options: string[];
  correct_answer: string;
  explanation: string;
};

function emptyDraft(): Draft {
  return {
    id: null,
    type: "mcq",
    question: "",
    options: ["", ""],
    correct_answer: "",
    explanation: "",
  };
}

export function QuizManager({
  lessonId,
  questions,
  onChange,
  save,
}: {
  lessonId: string;
  questions: Question[];
  onChange: (questions: Question[]) => void;
  save: SaveFn;
}) {
  const [draft, setDraft] = useState<Draft | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (!draft) return;
    if (!draft.question.trim()) {
      toast.error("Enter the question.");
      return;
    }
    const cleanOptions =
      draft.type === "mcq" ? draft.options.map((o) => o.trim()).filter(Boolean) : [];
    if (draft.type === "mcq" && cleanOptions.length < 2) {
      toast.error("Add at least two options.");
      return;
    }
    const payload = {
      type: draft.type,
      question: draft.question.trim(),
      options: cleanOptions,
      correct_answer: draft.correct_answer.trim() || null,
      explanation: draft.explanation.trim() || null,
    };

    setBusy(true);
    if (draft.id) {
      const ok = await save(() => updateQuestion(draft.id!, payload));
      if (ok) {
        onChange(
          questions.map((q) =>
            q.id === draft.id
              ? {
                  ...q,
                  type: payload.type,
                  question: payload.question,
                  options: draft.type === "true_false" ? ["True", "False"] : cleanOptions,
                  correct_answer: payload.correct_answer,
                  explanation: payload.explanation,
                }
              : q,
          ),
        );
        setDraft(null);
      }
    } else {
      let created: Question | null = null;
      const ok = await save(async () => {
        const res = await createQuestion(lessonId, payload);
        if (res.data) created = res.data as Question;
        return res;
      });
      if (ok && created) {
        onChange([...questions, created]);
        setDraft(null);
      }
    }
    setBusy(false);
  }

  async function remove(id: string) {
    const ok = await save(() => deleteQuestion(id));
    if (ok) onChange(questions.filter((q) => q.id !== id));
  }

  function edit(q: Question) {
    setDraft({
      id: q.id,
      type: q.type,
      question: q.question,
      options: q.type === "mcq" ? (q.options.length ? [...q.options] : ["", ""]) : ["", ""],
      correct_answer: q.correct_answer ?? "",
      explanation: q.explanation ?? "",
    });
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-semibold text-foreground">Quiz (Q&amp;A)</h4>
          <p className="text-xs text-muted-foreground">
            Total questions: {questions.length}
          </p>
        </div>
        {!draft ? (
          <Button size="sm" variant="outline" onClick={() => setDraft(emptyDraft())}>
            <Plus className="size-4" />
            Add Question
          </Button>
        ) : null}
      </div>

      {questions.length > 0 ? (
        <ol className="space-y-2">
          {questions.map((q, i) => (
            <li
              key={q.id}
              className="flex items-start justify-between gap-2 rounded-xl border border-border px-3 py-2 text-sm"
            >
              <div className="min-w-0">
                <p className="text-foreground">
                  <span className="font-medium">Q{i + 1}.</span> {q.question}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {QUESTION_TYPE_LABELS[q.type]}
                  {q.correct_answer ? ` · Answer: ${q.correct_answer}` : ""}
                </p>
              </div>
              <div className="flex shrink-0 gap-1">
                <Button size="icon" variant="ghost" className="size-7" onClick={() => edit(q)}>
                  <Pencil className="size-3.5" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="size-7 text-destructive hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => remove(q.id)}
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
            </li>
          ))}
        </ol>
      ) : !draft ? (
        <p className="rounded-xl border border-dashed border-border px-3 py-6 text-center text-xs text-muted-foreground">
          No questions yet.
        </p>
      ) : null}

      {draft ? (
        <div className="space-y-3 rounded-xl border border-border bg-secondary/30 p-3">
          <div className="grid gap-3 sm:grid-cols-[1fr_160px]">
            <div className="space-y-1">
              <Label htmlFor="q-text">Question</Label>
              <Input
                id="q-text"
                value={draft.question}
                onChange={(e) => setDraft({ ...draft, question: e.target.value })}
                placeholder="What is the first step of admission?"
              />
            </div>
            <div className="space-y-1">
              <Label>Type</Label>
              <Select
                value={draft.type}
                onValueChange={(v) =>
                  setDraft({ ...draft, type: v as QuestionType, correct_answer: "" })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(QUESTION_TYPE_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {draft.type === "mcq" ? (
            <div className="space-y-2">
              <Label>Options (click the check to mark the correct answer)</Label>
              {draft.options.map((opt, idx) => {
                const isCorrect = opt.trim() !== "" && draft.correct_answer === opt;
                return (
                  <div key={idx} className="flex items-center gap-2">
                    <button
                      type="button"
                      aria-label="Mark correct"
                      onClick={() => setDraft({ ...draft, correct_answer: opt })}
                      className={
                        isCorrect
                          ? "text-success"
                          : "text-muted-foreground hover:text-foreground"
                      }
                    >
                      <CheckCircle2 className="size-5" />
                    </button>
                    <Input
                      value={opt}
                      onChange={(e) => {
                        const options = [...draft.options];
                        const prev = options[idx];
                        options[idx] = e.target.value;
                        setDraft({
                          ...draft,
                          options,
                          correct_answer:
                            draft.correct_answer === prev ? e.target.value : draft.correct_answer,
                        });
                      }}
                      placeholder={`Option ${idx + 1}`}
                    />
                    {draft.options.length > 2 ? (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="size-8 shrink-0"
                        onClick={() =>
                          setDraft({
                            ...draft,
                            options: draft.options.filter((_, i) => i !== idx),
                          })
                        }
                      >
                        <X className="size-4" />
                      </Button>
                    ) : null}
                  </div>
                );
              })}
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setDraft({ ...draft, options: [...draft.options, ""] })}
              >
                <Plus className="size-4" />
                Add option
              </Button>
            </div>
          ) : null}

          {draft.type === "true_false" ? (
            <div className="space-y-1">
              <Label>Correct answer</Label>
              <Select
                value={draft.correct_answer || "True"}
                onValueChange={(v) => setDraft({ ...draft, correct_answer: v })}
              >
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="True">True</SelectItem>
                  <SelectItem value="False">False</SelectItem>
                </SelectContent>
              </Select>
            </div>
          ) : null}

          {draft.type === "short" ? (
            <div className="space-y-1">
              <Label htmlFor="q-answer">Model answer (optional)</Label>
              <Input
                id="q-answer"
                value={draft.correct_answer}
                onChange={(e) => setDraft({ ...draft, correct_answer: e.target.value })}
              />
            </div>
          ) : null}

          <div className="space-y-1">
            <Label htmlFor="q-exp">Explanation (optional)</Label>
            <Textarea
              id="q-exp"
              rows={2}
              value={draft.explanation}
              onChange={(e) => setDraft({ ...draft, explanation: e.target.value })}
            />
          </div>

          <div className="flex gap-2">
            <Button size="sm" onClick={submit} disabled={busy}>
              {busy ? <Loader2 className="size-4 animate-spin" /> : null}
              {draft.id ? "Save question" : "Add question"}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setDraft(null)} disabled={busy}>
              Cancel
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
