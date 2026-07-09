"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, Check } from "lucide-react";

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
import { addQuestion, deleteQuestion } from "@/features/admin/mock-test-actions";

type Question = {
  id: string;
  question: string;
  options: { key: string; label: string }[];
  correct_key: string;
};

const KEYS = ["a", "b", "c", "d"];

export function QuestionManager({
  testId,
  questions,
}: {
  testId: string;
  questions: Question[];
}) {
  const router = useRouter();
  const [question, setQuestion] = useState("");
  const [opts, setOpts] = useState(["", "", "", ""]);
  const [correct, setCorrect] = useState("a");
  const [explanation, setExplanation] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleAdd() {
    const options = KEYS.map((key, i) => ({ key, label: opts[i].trim() })).filter(
      (o) => o.label,
    );
    if (!question.trim() || options.length < 2) {
      toast.error("Add a question and at least two options.");
      return;
    }
    setBusy(true);
    const res = await addQuestion(testId, {
      question,
      options,
      correct_key: correct,
      explanation,
    });
    if (res.error) {
      toast.error(res.error);
      setBusy(false);
      return;
    }
    setQuestion("");
    setOpts(["", "", "", ""]);
    setCorrect("a");
    setExplanation("");
    router.refresh();
    setBusy(false);
  }

  async function handleDelete(id: string) {
    setBusy(true);
    const res = await deleteQuestion(id, testId);
    if (res.error) toast.error(res.error);
    else router.refresh();
    setBusy(false);
  }

  return (
    <div className="space-y-5">
      {/* Existing questions */}
      {questions.length > 0 ? (
        <ul className="space-y-3">
          {questions.map((q, i) => (
            <li
              key={q.id}
              className="rounded-2xl border border-border bg-card p-4 shadow-card"
            >
              <div className="flex items-start justify-between gap-3">
                <p className="font-medium text-foreground">
                  {i + 1}. {q.question}
                </p>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                  disabled={busy}
                  onClick={() => handleDelete(q.id)}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
              <ul className="mt-2 space-y-1 text-sm">
                {q.options.map((o) => (
                  <li
                    key={o.key}
                    className="flex items-center gap-2 text-muted-foreground"
                  >
                    {o.key === q.correct_key ? (
                      <Check className="size-4 text-success" />
                    ) : (
                      <span className="w-4" />
                    )}
                    {o.label}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">No questions yet.</p>
      )}

      {/* Add question */}
      <div className="space-y-3 rounded-2xl border border-border bg-card p-5 shadow-card">
        <h3 className="font-medium text-foreground">Add a question</h3>
        <div className="space-y-1">
          <Label htmlFor="q">Question</Label>
          <Textarea
            id="q"
            rows={2}
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
          />
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          {KEYS.map((key, i) => (
            <div key={key} className="space-y-1">
              <Label htmlFor={`opt-${key}`}>Option {key.toUpperCase()}</Label>
              <Input
                id={`opt-${key}`}
                value={opts[i]}
                onChange={(e) =>
                  setOpts((prev) => prev.map((v, idx) => (idx === i ? e.target.value : v)))
                }
              />
            </div>
          ))}
        </div>
        <div className="flex flex-wrap items-end gap-4">
          <div className="space-y-1">
            <Label>Correct answer</Label>
            <Select value={correct} onValueChange={setCorrect}>
              <SelectTrigger className="w-28">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {KEYS.map((key) => (
                  <SelectItem key={key} value={key}>
                    {key.toUpperCase()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1 space-y-1">
            <Label htmlFor="expl">Explanation</Label>
            <Input
              id="expl"
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
            />
          </div>
        </div>
        <Button onClick={handleAdd} disabled={busy}>
          {busy ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
          Add question
        </Button>
      </div>
    </div>
  );
}
