"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  answerSchema,
  createQuestionSchema,
  type AnswerInput,
  type CreateQuestionInput,
} from "./schemas";

export async function createQuestion(
  input: CreateQuestionInput,
): Promise<{ error: string }> {
  const parsed = createQuestionSchema.safeParse(input);
  if (!parsed.success) return { error: "Please check the form and try again." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Please log in to ask a question." };

  const { data, error } = await supabase
    .from("questions")
    .insert({
      student_id: user.id,
      title: parsed.data.title,
      body: parsed.data.body,
      program_id: parsed.data.program_id ? parsed.data.program_id : null,
      mentor_id: parsed.data.mentor_id ? parsed.data.mentor_id : null,
      status: "waiting",
      visibility: "private",
    })
    .select("id")
    .single();
  if (error || !data) return { error: "Could not submit your question." };

  redirect(`/dashboard/questions/${data.id}`);
}

export async function postAnswer(
  questionId: string,
  input: AnswerInput,
): Promise<{ error?: string }> {
  const parsed = answerSchema.safeParse(input);
  if (!parsed.success) return { error: "Please write a reply." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Please log in." };

  const { error } = await supabase.from("answers").insert({
    question_id: questionId,
    author_id: user.id,
    body: parsed.data.body,
  });
  if (error) return { error: "Could not post your reply." };

  // If the author is staff, mark the question answered.
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  if (profile?.role === "admin" || profile?.role === "mentor") {
    await supabase
      .from("questions")
      .update({ status: "answered" })
      .eq("id", questionId);
  }

  revalidatePath(`/dashboard/questions/${questionId}`);
  revalidatePath(`/admin/questions/${questionId}`);
  return {};
}

export async function closeQuestion(
  questionId: string,
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Please log in." };

  const { error } = await supabase
    .from("questions")
    .update({ status: "closed" })
    .eq("id", questionId);
  if (error) return { error: "Could not close the question." };

  revalidatePath(`/admin/questions/${questionId}`);
  revalidatePath(`/dashboard/questions/${questionId}`);
  return {};
}
