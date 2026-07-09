"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createQuestion } from "@/features/questions/actions";
import {
  createQuestionSchema,
  type CreateQuestionInput,
} from "@/features/questions/schemas";

export function NewQuestionForm({ mentorId }: { mentorId?: string }) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreateQuestionInput>({
    resolver: zodResolver(createQuestionSchema),
    defaultValues: { title: "", body: "", mentor_id: mentorId ?? "", program_id: "" },
  });

  async function onSubmit(values: CreateQuestionInput) {
    const res = await createQuestion(values);
    if (res?.error) toast.error(res.error);
    // success redirects server-side
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-4 rounded-2xl border border-border bg-card p-6 shadow-card"
      noValidate
    >
      <input type="hidden" {...register("mentor_id")} />
      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          placeholder="What do you need help with?"
          {...register("title")}
        />
        {errors.title ? (
          <p className="text-sm text-destructive">{errors.title.message}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="body">Your question</Label>
        <Textarea
          id="body"
          rows={6}
          placeholder="Describe your question in detail…"
          {...register("body")}
        />
        {errors.body ? (
          <p className="text-sm text-destructive">{errors.body.message}</p>
        ) : null}
      </div>

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : null}
        Submit question
      </Button>
    </form>
  );
}
